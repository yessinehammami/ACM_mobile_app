import { useState, useEffect, useRef } from 'preact/hooks';
import {
  FILTER_COLUMNS,
  PAGE_SIZE
} from './constants.js';
import { fetchCSV, parseCSVAndBuildOptions } from './services/dataService.js';
import { filterAndPaginate } from './services/filterService.js';
import { DesktopLayout } from './layouts/DesktopLayout.jsx';
import { MobileLayout } from './layouts/MobileLayout.jsx';


export function App() {
  // Data state
  const [allRows, setAllRows] = useState([]);
  const [initialOptions, setInitialOptions] = useState({});
  const [loading, setLoading] = useState(true);

  // Filter & pagination state
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  // UI state
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Data source state
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  // Refs
  const resultsCache = useRef({});

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch CSV
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const result = await fetchCSV();
        const csvText = result.data;
        const source = result.source;
        
        clearTimeout(timeoutId);
        setDataSource(source);
        
        // Parse CSV
        const { rows: parsedRows, options: parsedOptions } = await parseCSVAndBuildOptions(csvText);
        
        setAllRows(parsedRows);
        setInitialOptions(parsedOptions);
        setOptions(parsedOptions);
        resultsCache.current = {};
        setLoading(false);
      } catch (e) {
        console.error('Failed to load data:', e.message, e);
        alert(`Error loading data: ${e.message}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter and paginate
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    setPage(1);
    
    const result = filterAndPaginate(allRows, newFilters, 1, resultsCache.current, initialOptions);
    setCount(result.count);
    setRows(result.rows);
    setOptions(result.options === null ? initialOptions : result.options);
  };

  const clearFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setPage(1);
    
    const result = filterAndPaginate(allRows, newFilters, 1, resultsCache.current, initialOptions);
    setCount(result.count);
    setRows(result.rows);
    setOptions(result.options === null ? initialOptions : result.options);
  };

  const handlePageChange = (newPage) => {
    const maxPage = Math.ceil(count / PAGE_SIZE);
    if (newPage >= 1 && newPage <= maxPage) {
      setPage(newPage);
      
      const result = filterAndPaginate(allRows, filters, newPage, resultsCache.current, initialOptions);
      setRows(result.rows);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#242d4a',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2 style={{ color: '#87CEEB', margin: '0' }}>📦 Chargement...</h2>
        <p style={{ color: '#b0b0d0', margin: '0' }}>Veuillez patienter</p>
      </div>
    );
  }

  const commonProps = {
    count,
    rows,
    page,
    totalPages,
    filters,
    options,
    lastUpdate,
    dataSource,
    handleFilterChange,
    clearFilter,
    handlePageChange,
    FILTER_COLUMNS
  };

  const mobileProps = {
    ...commonProps,
    showFiltersModal,
    setShowFiltersModal,
    setFilters,
    setOptions,
    setCount,
    setRows,
    setPage,
    initialOptions,
    resultsCache
  };

  return isMobile ? 
    <MobileLayout {...mobileProps} /> : 
    <DesktopLayout {...commonProps} />;
}
