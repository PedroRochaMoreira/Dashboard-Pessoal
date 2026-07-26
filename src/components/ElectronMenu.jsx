import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, Calendar, Wallet, BookOpen, Settings } from 'lucide-react';
import './ElectronMenu.css';

const items = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/estudos', label: 'Estudos', icon: BookOpen },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function ElectronMenu() {
  const [isElectron, setIsElectron] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const electron = Boolean(window.electronAPI?.isElectron);
    setIsElectron(electron);
    if (electron) document.body.classList.add('is-electron');
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isElectron) return null;

  return (
    <>
      <button
        className="electron-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className={`electron-menu-panel ${open ? 'open' : ''}`} ref={panelRef}>
        <div className="electron-menu-brand">Painel PP</div>
        <nav className="electron-menu-links">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `electron-menu-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {open && <div className="electron-menu-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}