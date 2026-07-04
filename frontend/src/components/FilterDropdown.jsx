import { useState } from 'preact/hooks';

export function FilterDropdown({ label, allOptions, selectedValue, onSelect, onClear }) {
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
              left: '0',
              right: '0',
              backgroundColor: '#2f3f55',
              border: '1px solid #5a6a8a',
              borderRadius: '4px',
              maxHeight: '150px',
              overflowY: 'auto',
              zIndex: 100,
              marginTop: '2px'
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '0.5rem', color: '#666' }}>Aucun résultat</div>
              ) : (
                filtered.map(opt => (
                  <div
                    key={opt}
                    onClick={() => {
                      onSelect(opt);
                      setOpen(false);
                      setSearch('');
                    }}
                    style={{
                      padding: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: opt === selectedValue ? '#00d4ff' : 'transparent',
                      color: opt === selectedValue ? '#1a1a2e' : '#e0e0e0',
                      fontSize: '12px',
                      borderBottom: '1px solid #4a5a7a'
                    }}
                  >
                    {opt}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {selectedValue && (
          <button
            onClick={onClear}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#ff6b6b',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
