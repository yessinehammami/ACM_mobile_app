import { PAGE_SIZE } from '../constants.js';

/**
 * Filter and paginate data
 */
export const filterAndPaginate = (
  dataRows,
  filterObj,
  pageNum,
  resultsCache,
  initialOptions
) => {
  const hasFilters = Object.values(filterObj).some(val => val);
  
  if (!hasFilters) {
    return {
      count: 0,
      rows: [],
      options: null // Return null so app.jsx falls back to initialOptions
    };
  }

  const cacheKey = JSON.stringify(
    Object.entries(filterObj).filter(([, v]) => v).sort()
  );

  if (resultsCache[cacheKey]) {
    const { filteredRows, filteredCount, computedOptions } = resultsCache[cacheKey];
    const startIdx = (pageNum - 1) * PAGE_SIZE;
    const paginatedRows = filteredRows.slice(startIdx, startIdx + PAGE_SIZE);
    
    return {
      count: filteredCount,
      rows: paginatedRows,
      options: computedOptions
    };
  }

  // Apply filters
  const filtered = dataRows.filter(row => {
    return Object.entries(filterObj)
      .filter(([, v]) => v)
      .every(([key, value]) => {
        return String(row[key] || '') === String(value);
      });
  });

  // Build updated options from filtered data - for ALL columns
  const newOptions = {};
  const filterKeys = Object.keys(initialOptions || {});
  
  filterKeys.forEach(key => {
    const uniqueVals = new Set();
    filtered.forEach(row => {
      const val = row[key];
      if (val !== null && val !== undefined && val !== '' && val !== 'N/A') {
        uniqueVals.add(val);
      }
    });
    newOptions[key] = Array.from(uniqueVals).sort();
  });

  // Cache results
  resultsCache[cacheKey] = {
    filteredRows: filtered,
    filteredCount: filtered.length,
    computedOptions: newOptions
  };

  // Paginate
  const startIdx = (pageNum - 1) * PAGE_SIZE;
  const paginatedRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  return {
    count: filtered.length,
    rows: paginatedRows,
    options: newOptions
  };
};
