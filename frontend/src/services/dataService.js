import Papa from 'papaparse';
import {
  GITHUB_CSV_URL,
  BUNDLED_CSV_URL,
  STORAGE_KEY,
  STORAGE_TIMESTAMP_KEY,
  STORAGE_SOURCE_KEY,
  FILTER_COLUMNS
} from '../constants.js';

const saveToCache = (csvText, source) => {
  try {
    localStorage.setItem(STORAGE_KEY, csvText);
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem(STORAGE_SOURCE_KEY, source);
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
};

const tryFetch = async (url, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok ? await res.text() : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
};

/**
 * Fetch CSV with fallback strategy:
 * 1. Try GitHub raw URL (latest data from monthly Action run)
 * 2. Fall back to bundled CSV (data at APK build time)
 * 3. Fall back to localStorage cache
 */
export const fetchCSV = async () => {
  // Strategy 1: GitHub raw URL (updated monthly by GitHub Actions)
  if (GITHUB_CSV_URL) {
    console.log('Attempting to fetch CSV from GitHub:', GITHUB_CSV_URL);
    const githubData = await tryFetch(GITHUB_CSV_URL, 15000);
    if (githubData) {
      console.log('✓ CSV loaded from GITHUB, size:', githubData.length);
      saveToCache(githubData, 'github');
      return { data: githubData, source: 'github' };
    }
    console.warn('GitHub CSV fetch failed, trying next source...');
  }

  // Strategy 2: Bundled CSV (baked into the app at build time)
  console.log('Falling back to bundled CSV:', BUNDLED_CSV_URL);
  const bundledData = await tryFetch(BUNDLED_CSV_URL, 5000);
  if (bundledData) {
    console.log('✓ CSV loaded from BUNDLED file, size:', bundledData.length);
    saveToCache(bundledData, 'bundled');
    return { data: bundledData, source: 'bundled' };
  }

  // Strategy 3: localStorage cache (last successful fetch)
  console.log('Trying cached data from localStorage...');
  try {
    const cachedData = localStorage.getItem(STORAGE_KEY);
    const cachedSource = localStorage.getItem(STORAGE_SOURCE_KEY);
    if (cachedData) {
      console.log('✓ CSV loaded from CACHE, source was:', cachedSource);
      return { data: cachedData, source: `cached (${cachedSource})` };
    }
  } catch (e) {
    console.warn('Could not access localStorage:', e);
  }

  throw new Error('Could not load CSV from any source (github, bundled, or cache)');
};

/**
 * Parse CSV and build filter options
 */
export const parseCSVAndBuildOptions = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.filter(row => Object.values(row).some(val => val));
        
        const options = {};
        const filterKeys = FILTER_COLUMNS.map(col => col.key);
        
        filterKeys.forEach(key => {
          const uniqueVals = new Set();
          rows.forEach(row => {
            const val = row[key];
            if (val !== null && val !== undefined && val !== '' && val !== 'N/A') {
              uniqueVals.add(val);
            }
          });
          options[key] = Array.from(uniqueVals).sort();
        });
        
        resolve({ rows, options });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};
