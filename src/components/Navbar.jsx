import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Wallet, BookOpen, Settings } from 'lucide-react';

const items = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/estudos', label: 'Estudos', icon: BookOpen },
  { path: '/configuracoes', label: 'Ajustes', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const activeIndex = items.findIndex((item) => item.path === location.pathname);

  return (
    <nav className="bottom-nav">
      <div
        className="bottom-nav-indicator"
        style={{ transform: `translateX(${activeIndex >= 0 ? activeIndex : 0}00%)` }}
      />
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === activeIndex;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}