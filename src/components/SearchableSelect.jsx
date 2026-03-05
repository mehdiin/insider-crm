import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options = [], value, onChange, onCreate, placeholder = 'Sélectionner...', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  const canCreate = onCreate && search.trim() && !filtered.find(o => o.name.toLowerCase() === search.trim().toLowerCase());

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCreate = () => {
    const name = search.trim();
    if (name && onCreate) {
      const id = onCreate(name);
      onChange(id);
      setSearch('');
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`ss-wrap ${disabled ? 'ss-disabled' : ''}`}>
      <button
        type="button"
        className="ss-trigger"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'ss-placeholder'}>{selected ? selected.name : placeholder}</span>
        <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
      </button>

      {open && (
        <div className="ss-dropdown">
          <input
            ref={inputRef}
            className="ss-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            onKeyDown={e => {
              if (e.key === 'Enter' && canCreate) handleCreate();
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div className="ss-list">
            {value && (
              <div className="ss-option ss-clear" onClick={() => { onChange(null); setOpen(false); setSearch(''); }}>
                ✕ Effacer
              </div>
            )}
            {filtered.map(opt => (
              <div
                key={opt.id}
                className={`ss-option ${opt.id === value ? 'ss-selected' : ''}`}
                onClick={() => { onChange(opt.id); setOpen(false); setSearch(''); }}
              >
                {opt.name}
              </div>
            ))}
            {canCreate && (
              <div className="ss-option ss-create" onClick={handleCreate}>
                + Créer &quot;{search.trim()}&quot;
              </div>
            )}
            {filtered.length === 0 && !canCreate && (
              <div className="ss-empty">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
