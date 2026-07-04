import { FilterDropdown } from '../components/FilterDropdown.jsx';
import { FILTER_COLUMNS, PAGE_SIZE } from '../constants.js';

export function DesktopLayout({
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
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
        flexShrink: 0
      }}>
        <h1 style={{ margin: '0', fontSize: '24px', color: '#00d4ff', fontWeight: '700' }}>
          📦 ACM Database
        </h1>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#b0b0d0' }}>
            <strong>{count.toLocaleString()}</strong> produits
          </div>
          <div style={{ fontSize: '11px', color: '#888', textAlign: 'right' }}>
            {lastUpdate && (
              <>
                <div>Dernière mise à jour:</div>
                <div>{lastUpdate}</div>
              </>
            )}
            {dataSource && (
              <div style={{ marginTop: '0.25rem', color: '#666', fontSize: '10px' }}>
                Source: {dataSource}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '1.5rem',
        overflow: 'hidden',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Left Sidebar - Filters */}
        <div style={{
          width: '340px',
          backgroundColor: '#2f3f55',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid #4a5a7a',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <h3 style={{
            fontSize: '12px',
            color: '#b0b0d0',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 1.5rem 0'
          }}>
            🔍 Filtres
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
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
        </div>

        {/* Right Content - Table */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2f3f55',
          borderRadius: '10px',
          border: '1px solid #4a5a7a',
          overflow: 'hidden'
        }}>
          {Object.keys(filters).length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
              <p style={{ margin: '0', fontSize: '14px' }}>Sélectionnez un filtre pour voir les résultats</p>
            </div>
          ) : (
            <>
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '1.5rem',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  borderRadius: '6px',
                  border: '1px solid #4a5a7a',
                  backgroundColor: '#242d4a',
                  overflow: 'hidden'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px'
                  }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr style={{ backgroundColor: '#1a2238' }}>
                        {FC.map(({ key, label }) => (
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
                            colSpan={FC.length}
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
                              borderBottom: '1px solid #4a5a7a'
                            }}
                          >
                            {FC.map(({ key }) => (
                              <td
                                key={key}
                                style={{
                                  padding: '0.8rem',
                                  color: '#e0e0e0',
                                  fontSize: '12px',
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {row[key] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #4a5a7a',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  backgroundColor: '#242d4a',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: page === 1 ? '#444' : '#00d4ff',
                      color: page === 1 ? '#888' : '#1a1a2e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    ◄ Précédent
                  </button>
                  <span style={{ color: '#b0b0d0', fontSize: '12px' }}>
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: page === totalPages ? '#444' : '#00d4ff',
                      color: page === totalPages ? '#888' : '#1a1a2e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Suivant ►
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
