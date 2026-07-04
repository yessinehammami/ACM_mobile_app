import { useEffect } from 'preact/hooks';
import Papa from 'papaparse';
import { STATUS_API_URL, STORAGE_REFRESH_DATE_KEY, STORAGE_BACKEND_UPDATE_KEY } from '../constants.js';
import { fetchCSV, parseCSVAndBuildOptions } from '../services/dataService.js';

/**
 * Hook to refresh data on Sunday
 */
export const useSundayRefresh = ({
  backendLastUpdate,
  setBackendLastUpdate,
  setLastUpdate,
  setAllRows,
  setInitialOptions,
  setOptions,
  setFilters,
  setPage,
  setCount,
  setRows,
  resultsCache
}) => {
  useEffect(() => {
    const checkSundayRefresh = async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Only check on Sunday (0 = Sunday)
      if (dayOfWeek !== 0) return;
      
      // Check if already refreshed today
      const lastRefreshDate = localStorage.getItem(STORAGE_REFRESH_DATE_KEY);
      const todayDate = today.toDateString();
      
      if (lastRefreshDate === todayDate) {
        console.log('✓ Already refreshed today (Sunday)');
        return;
      }

      try {
        console.log('📦 Sunday detected! Checking for fresh data from backend...');
        
        const statusRes = await fetch(STATUS_API_URL);
        if (statusRes.ok) {
          const status = await statusRes.json();
          
          if (status.last_update && status.last_update !== backendLastUpdate) {
            console.log('📦 Fresh data available! Refreshing...');
            console.log('Old:', backendLastUpdate);
            console.log('New:', status.last_update);
            
            setBackendLastUpdate(status.last_update);
            setLastUpdate(new Date(status.last_update).toLocaleString());
            
            // Fetch fresh data
            try {
              const result = await fetchCSV();
              const csvText = result.data;
              
              const { rows, options } = await parseCSVAndBuildOptions(csvText);
              
              setAllRows(rows);
              setInitialOptions(options);
              setOptions(options);
              resultsCache.current = {};
              
              // Reset filters
              setFilters({});
              setPage(1);
              setCount(0);
              setRows([]);
              
              // Mark as refreshed
              localStorage.setItem(STORAGE_REFRESH_DATE_KEY, todayDate);
              
              console.log('✓ Data refreshed! Loaded', rows.length, 'rows');
            } catch (e) {
              console.error('Failed to refresh data:', e);
            }
          } else {
            console.log('✓ No new data from backend');
            localStorage.setItem(STORAGE_REFRESH_DATE_KEY, todayDate);
          }
        }
      } catch (e) {
        console.warn('Could not check for Sunday refresh:', e);
      }
    };

    checkSundayRefresh();
  }, [backendLastUpdate]);
};
