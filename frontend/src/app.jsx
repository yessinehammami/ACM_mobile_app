import { useState, useEffect, useRef } from 'preact/hooks';

const API = 'http://localhost:8000';
const PAGE_SIZE = 200;

const FILTER_COLUMNS = [
  { key: 'Produit', label: 'Produit' },
  { key: 'Importateur', label: 'Importateur' },
  { key: 'Fournisseur', label: 'Fournisseur' },
  { key: 'Provenance', label: 'Provenance' },
  { key: 'N° Lot', label: 'N° Lot' },
  { key: 'Fabrication', label: 'Fabrication' },
  { key: 'Expiration', label: 'Expiration' },
  { key: 'article_code', label: 'Article code' },
  { key: 'Référence', label: 'Référence' },
];

function FilterDropdown({ label, allOptions, selectedValue, onSelect, onClear }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = allOptions.filter(opt =>
    opt && String(opt).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      padding: '0.75rem',
      backgroundColor: '#3d4d6a',
      borderRadius: '6px',
      border: '1px solid #5a6a8a',
      position: 'relative'
    }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        fontSize: '11px',
        color: '#00d4ff',
        textTransform: 'uppercase',
        letterSpacing: '0.3px'
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.4rem', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Tapez pour chercher..."
            value={open ? search : (selectedValue || '')}
            onInput={(e) => {
              const newSearch = e.target.value;
              setSearch(newSearch);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              if (selectedValue) {
                setSearch('');
              }
            }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #6a7a9a',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#242d4a',
              color: '#e0e0e0',
              boxSizing: 'border-box'
            }}
          />

          {open && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#242d4a',
              border: '1px solid #6a7a9a',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              maxHeight: '250px',
              overflowY: 'auto',
              zIndex: 1000,
              marginTop: '-1px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}>
              {filtered.length > 0 ? (
                filtered.slice(0, 50).map(opt => (
                  <div
                    key={opt}
                    onClick={() => {
                      onSelect(opt);
                      setSearch('');
                      setOpen(false);
                    }}
                    style={{
                      padding: '0.8rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #3d4d6a',
                      color: '#e0e0e0',
                      fontSize: '12px',
                      backgroundColor: '#242d4a',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4d6a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#242d4a'}
                  >
                    {opt}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '0.8rem',
                  color: '#999',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  Aucun résultat
                </div>
              )}
              {filtered.length > 50 && (
                <div style={{
                  padding: '0.8rem',
                  color: '#7a8aaa',
                  fontSize: '11px',
                  textAlign: 'center',
                  backgroundColor: '#1a2238'
                }}>
                  +{filtered.length - 50} plus...
                </div>
              )}
            </div>
          )}
        </div>
        {selectedValue && (
          <button
            onClick={() => { onClear(); setSearch(''); }}
            style={{
              padding: '0.5rem 0.6rem',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [allRows, setAllRows] = useState([]);
  const [initialOptions, setInitialOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({}); // Dynamic options based on current filters
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cache for computed filter results to avoid recalculation
  const resultsCache = useRef({});

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`${API}/data/all`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setAllRows(data.rows);
        setInitialOptions(data.options);
        setOptions(data.options); // Initialize dynamic options with all options
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

  // Filter rows based on current filters and pagination
  const filterAndPaginate = (dataRows, filterObj, pageNum) => {
    const hasFilters = Object.values(filterObj).some(val => val);
    if (!hasFilters) {
      setCount(0);
      setRows([]);
      setOptions(initialOptions); // Reset to all options when no filters
      return;
    }

    const cacheKey = JSON.stringify(Object.entries(filterObj).filter(([, v]) => v).sort());

    if (resultsCache.current[cacheKey]) {
      const { filteredRows, filteredCount, computedOptions } = resultsCache.current[cacheKey];
      const start = (pageNum - 1) * PAGE_SIZE;
      setCount(filteredCount);
      setRows(filteredRows.slice(start, start + PAGE_SIZE));
      setOptions(computedOptions); // Use cached options
      return;
    }

    let filtered = dataRows;
    Object.entries(filterObj).forEach(([col, val]) => {
      if (val) {
        filtered = filtered.filter(row => String(row[col]) === String(val));
      }
    });

    // Recalculate available options for each column based on filtered data
    const newOptions = {};
    const filterKeys = Object.keys(initialOptions || {});
    filterKeys.forEach(key => {
      const uniqueVals = new Set();
      filtered.forEach(row => {
        const val = row[key];
        if (val !== null && val !== undefined && val !== '') {
          uniqueVals.add(val);
        }
      });
      newOptions[key] = Array.from(uniqueVals).sort();
    });

    const start = (pageNum - 1) * PAGE_SIZE;
    setCount(filtered.length);
    setRows(filtered.slice(start, start + PAGE_SIZE));
    setOptions(newOptions);

    resultsCache.current[cacheKey] = {
      filteredRows: filtered,
      filteredCount: filtered.length,
      computedOptions: newOptions
    };
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    setPage(1);
    filterAndPaginate(allRows, newFilters, 1);
  };

  const clearFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setPage(1);
    filterAndPaginate(allRows, newFilters, 1);
  };

  const handlePageChange = (newPage) => {
    const maxPage = Math.ceil(count / PAGE_SIZE);
    if (newPage >= 1 && newPage <= maxPage) {
      setPage(newPage);
      filterAndPaginate(allRows, filters, newPage);
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    await fetch(`${API}/refresh`, { method: 'POST' });

    const poll = setInterval(async () => {
      const status = await fetch(`${API}/refresh-status`).then(r => r.json());
      if (!status.running) {
        clearInterval(poll);
        setRefreshing(false);

        const res = await fetch(`${API}/data/all`);
        const data = await res.json();
        setAllRows(data.rows);
        setInitialOptions(data.options);
        setOptions(data.options); // Reset options to all options after refresh
        setPage(1);
        setFilters({});
        resultsCache.current = {};
        filterAndPaginate(data.rows, {}, 1);
      }
    }, 1000);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: '#87CEEB' }}>Chargement des données...</h2>
        <p>Veuillez patienter, cela peut prendre quelques secondes...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      padding: '0',
      margin: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#242d4a',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Top Header Bar */}
      <div style={{
        backgroundColor: '#1a2238',
        borderBottom: '1px solid #4a5a7a',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        height: '60px',
        flexShrink: 0
      }}>
        <h1 style={{
          margin: '0',
          fontSize: '24px',
          color: '#00d4ff',
          fontWeight: '700',
          letterSpacing: '1px'
        }}>
          📦 ACM Database
        </h1>
        <div style={{ fontSize: '12px', color: '#b0b0d0' }}>
          <strong>{count.toLocaleString()}</strong> produits
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '1.5rem',
        overflow: 'hidden',
        width: '100%',
        padding: '1.5rem',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Left Sidebar - Filters */}
        <div style={{
          width: '340px',
          backgroundColor: '#2f3f55',
          padding: '1.5rem',
          borderRadius: '10px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          flexShrink: 0,
          border: '1px solid #4a5a7a'
        }}>
          {/* Refresh Section */}
          <div style={{
            backgroundColor: '#3d4d6a',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #5a6a8a'
          }}>
            <button
              onClick={triggerRefresh}
              disabled={refreshing}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: refreshing ? '#444' : '#00d4ff',
                color: refreshing ? '#888' : '#1a1a2e',
                border: 'none',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
            >
              {refreshing ? '⏳ Chargement...' : '🔄 Rafraichir'}
            </button>
            <p style={{
              color: '#ff6b6b',
              fontWeight: 'bold',
              fontSize: '10px',
              margin: '0.5rem 0 0 0',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              ⏱️ ~1 heure
            </p>
          </div>

          {/* Filters Header */}
          <h3 style={{
            marginBottom: '1rem',
            fontSize: '12px',
            color: '#b0b0d0',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 1rem 0'
          }}>
            🔍 Rechercher
          </h3>

          {/* Filter Groups */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1rem'
          }}>
            {FILTER_COLUMNS.map(({ key, label }) => (
              <FilterDropdown
                key={key}
                label={label}
                allOptions={options[key] || []}
                selectedValue={filters[key]}
                onSelect={(val) => handleFilterChange(key, val)}
                onClear={() => clearFilter(key)}
              />
            ))}
          </div>
        </div>

        {/* Center - Main Content Table */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2f3f55',
          borderRadius: '10px',
          padding: '1.5rem',
          boxSizing: 'border-box',
          overflow: 'hidden',
          border: '1px solid #4a5a7a'
        }}>
          {Object.keys(filters).length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem'
            }}>
              <div style={{ fontSize: '48px' }}>🔍</div>
              <h2 style={{
                margin: '0',
                fontSize: '20px',
                color: '#b0b0d0',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Utilisez les filtres pour afficher les données
              </h2>
              <p style={{
                margin: '0',
                fontSize: '13px',
                color: '#7a8aaa',
                textAlign: 'center',
                maxWidth: '300px'
              }}>
                Sélectionnez au moins un filtre à gauche pour voir les résultats
              </p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '18px',
                  color: '#e0e0e0',
                  fontWeight: '600'
                }}>
                  📊 Résultats
                </h2>
                <div style={{ fontSize: '12px', color: '#b0b0d0' }}>
                  <strong>{count.toLocaleString()}</strong> résultats • Page <strong>{page} / {totalPages}</strong> ({rows.length} affichées)
                </div>
              </div>

              {/* Pagination Controls */}
              <div style={{
                display: 'flex',
                gap: '0.8rem',
                marginBottom: '1rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: page === 1 ? '#4a5a7a' : '#00d4ff',
                    color: page === 1 ? '#888' : '#1a2238',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  ← Précédent
                </button>
                <span style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: '#242d4a',
                  color: '#b0b0d0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: page === totalPages ? '#4a5a7a' : '#00d4ff',
                    color: page === totalPages ? '#888' : '#1a2238',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Suivant →
                </button>
              </div>

              {/* Data Table */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #4a5a7a',
                borderRadius: '6px',
                backgroundColor: '#242d4a'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ backgroundColor: '#1a2238' }}>
                      {FILTER_COLUMNS.map(({ key, label }) => (
                        <th
                          key={key}
                          style={{
                            padding: '0.8rem',
                            color: '#00d4ff',
                            fontWeight: '600',
                            textAlign: 'left',
                            borderBottom: '2px solid #4a5a7a',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={FILTER_COLUMNS.length}
                          style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#666'
                          }}
                        >
                          Aucune donnée
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? '#242d4a' : '#2f3f55',
                            borderBottom: '1px solid #4a5a7a',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {FILTER_COLUMNS.map(({ key }) => (
                            <td
                              key={key}
                              style={{
                                padding: '0.7rem 0.8rem',
                                color: '#e0e0e0',
                                fontSize: '12px'
                              }}
                            >
                              {row[key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}