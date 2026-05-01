import { Sidebar } from './Sidebar';
import { AppRoute, User } from '../../types';

interface AppLayoutProps {
  user: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  children: React.ReactNode;
  pageTitle?: string;
  pageActions?: React.ReactNode;
}

export function AppLayout({
  user,
  currentRoute,
  onNavigate,
  onLogout,
  children,
  pageTitle,
  pageActions,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        userName={user.email.split('@')[0]}
        orgName={user.organizationName}
        onLogout={onLogout}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        {pageTitle && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4 shrink-0">
            <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
            {pageActions && <div className="flex items-center gap-2">{pageActions}</div>}
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
