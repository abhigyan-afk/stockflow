import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { AppRoute } from '../../types';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  userName: string;
  orgName: string;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  route: AppRoute;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', route: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Products', route: 'products', icon: <Package className="h-4 w-4" /> },
  { label: 'Settings', route: 'settings', icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar({ currentRoute, onNavigate, userName, orgName, onLogout }: SidebarProps) {
  const activeBase = (route: AppRoute) => {
    if (route === 'products') {
      return (
        currentRoute === 'products' ||
        currentRoute === 'products/new' ||
        currentRoute === 'products/edit'
      );
    }
    return currentRoute === route;
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-200">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="block text-sm font-bold tracking-tight text-slate-900">StockFlow</span>
          <span className="block text-[10px] font-medium text-indigo-500 uppercase tracking-wide">MVP v0.1</span>
        </div>
      </div>

      {/* Org name */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">{orgName}</p>
            <p className="text-[10px] text-slate-400">Organization</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {navItems.map((item) => (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              activeBase(item.route)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <span
              className={cn(
                'transition-colors',
                activeBase(item.route) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
              )}
            >
              {item.icon}
            </span>
            {item.label}
            {activeBase(item.route) && (
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-400" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700">{userName}</p>
            <p className="text-[10px] text-slate-400">Owner</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
