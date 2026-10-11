import { FilterDropdown } from '../components/FilterDropdown.jsx';
import { PharmacyLogo } from '../components/PharmacyLogo.jsx';
import { FILTER_COLUMNS, PAGE_SIZE } from '../constants.js';

export function MobileLayout({
  count,
  rows,
  page,
  totalPages,
  filters,
  options,
  lastUpdate,
  dataSource,
  showFiltersModal,
  setShowFiltersModal,
  handleFilterChange,
  clearFilter,
  handlePageChange,
  setFilters,
  setOptions,
  setCount,
  setRows,
  setPage,
  initialOptions,
  resultsCache,
  FILTER_COLUMNS: FC
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#242d4a',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1a2238',
        borderBottom: '1px solid #4a5a7a',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '50px',
        flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <h1 style={{ margin: '0', fontSize: '18px', color: '#00d4ff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45em' }}>
          <PharmacyLogo size={20} />
          AMC / DM
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '11px', color: '#b0b0d0' }}>
              <strong>{count.toLocaleString()}</strong>
            </div>
            {lastUpdate && (
              <div style={{ fontSize: '9px', color: '#888' }}>
                {lastUpdate.split(',')[0]}
              </div>
            )}
            {dataSource && (
              <div style={{ fontSize: '8px', color: '#666' }}>
                {dataSource}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFiltersModal(true)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: Object.keys(filters).length > 0 ? '#ff6b6b' : '#00d4ff',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔍 {Object.keys(filters).length > 0 ? 'Filtres (' + Object.keys(filters).length + ')' : 'Filtrer'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0.75rem',
        boxSizing: 'border-box'
      }}>
        {Object.keys(filters).length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🔍</div>
            <p style={{ margin: '0', fontSize: '14px', marginBottom: '0.5rem' }}>Appuyez sur Filtrer</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#555' }}>pour voir les résultats</p>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Mobile Table - Simplified View */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              borderRadius: '8px',
              border: '1px solid #4a5a7a',
              backgroundColor: '#242d4a'
            }}>
              {rows.length === 0 ? (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  Aucune donnée
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#2f3f55',
                        border: '1px solid #4a5a7a',
                        borderRadius: '6px',
                        padding: '1rem',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ color: '#00d4ff', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {row['Produit'] || 'N/A'}
                      </div>
                      <div style={{ color: '#b0b0d0', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#00d4ff' }}>Importateur:</span> {row['Importateur'] || '—'}
                      </div>
                      <div style={{ color: '#b0b0d0', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#00d4ff' }}>Fournisseur:</span> {row['Fournisseur'] || '—'}
                      </div>
                      <div style={{ color: '#b0b0d0', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#00d4ff' }}>Provenance:</span> {row['Provenance'] || '—'}
                      </div>
                      <div style={{ color: '#b0b0d0', fontSize: '11px', marginTop: '0.5rem', borderTop: '1px solid #4a5a7a', paddingTop: '0.5rem' }}>
                        <span style={{ color: '#00d4ff' }}>N° Lot:</span> {row['N° Lot'] || '—'} | <span style={{ color: '#00d4ff' }}>Exp:</span> {row['Expiration'] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '0.75rem',
                marginTop: '0.75rem',
                borderTop: '1px solid #4a5a7a',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#1a2238',
                borderRadius: '6px',
                flexShrink: 0
              }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: page === 1 ? '#444' : '#00d4ff',
                    color: page === 1 ? '#888' : '#1a1a2e',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ◄
                </button>
                <span style={{ color: '#b0b0d0', fontSize: '11px' }}>
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: page === totalPages ? '#444' : '#00d4ff',
                    color: page === totalPages ? '#888' : '#1a1a2e',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ►
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal Overlay */}
      {showFiltersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Modal Content */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#2f3f55',
            borderRadius: '16px 16px 0 0',
            border: '1px solid #4a5a7a',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #4a5a7a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ margin: '0', fontSize: '16px', color: '#00d4ff', fontWeight: '700' }}>
                🔍 Filtres
              </h2>
              <button
                onClick={() => setShowFiltersModal(false)}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem',
              boxSizing: 'border-box'
            }}>
              {FC.map(({ key, label }) => (
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

            {/* Modal Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #4a5a7a',
              display: 'flex',
              gap: '0.5rem',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  setFilters({});
                  setOptions(initialOptions);
                  setCount(0);
                  setRows([]);
                  setPage(1);
                  resultsCache.current = {};
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#444',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#00d4ff',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Voir résultats ({count})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
