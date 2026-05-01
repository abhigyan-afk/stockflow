/**
 * App.tsx — StockFlow MVP Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side router (no react-router — simple state machine for demo clarity).
 * Maps AppRoute → Page component.
 *
 * Real-world: replace appStore with fetch() calls to Express REST API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { AppRoute, User } from './types';
import { api, session } from './lib/api';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState<User | null>(() => session.getUser());
  const [booting, setBooting] = useState(() => !!session.getToken());
  const [route, setRoute] = useState<AppRoute>(() => {
    if (!session.getUser()) return 'login';
    return 'dashboard';
  });
  const [editProductId, setEditProductId] = useState<string | undefined>();

  // Validate a persisted JWT session on app boot.
  useEffect(() => {
    if (!session.getToken()) {
      setBooting(false);
      return;
    }

    api.auth
      .me()
      .then((currentUser) => {
        setUser(currentUser);
        setRoute('dashboard');
      })
      .catch(() => {
        setUser(null);
        setRoute('login');
      })
      .finally(() => setBooting(false));
  }, []);

  // Keep route in sync when user state changes
  useEffect(() => {
    if (!user && route !== 'login' && route !== 'signup') {
      setRoute('login');
    }
  }, [user, route]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setRoute('dashboard');
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setRoute('login');
  };

  const handleSignupSuccess = (signedUpUser: User) => {
    setUser(signedUpUser);
    setRoute('dashboard');
  };

  const handleNavigate = (newRoute: AppRoute, productId?: string) => {
    if (newRoute === 'products/edit' && productId) {
      setEditProductId(productId);
    }
    setRoute(newRoute);
  };

  // ── Guards ────────────────────────────────────────────────────────────────

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Connecting to StockFlow API…
      </div>
    );
  }

  if (!user) {
    if (route === 'signup') {
      return (
        <SignupPage
          onSignupSuccess={handleSignupSuccess}
          onGoLogin={() => setRoute('login')}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoSignup={() => setRoute('signup')}
      />
    );
  }

  // ── Authenticated routes ──────────────────────────────────────────────────

  const commonProps = {
    user,
    currentRoute: route,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
  };

  switch (route) {
    case 'dashboard':
      return <DashboardPage {...commonProps} />;

    case 'products':
      return <ProductsPage {...commonProps} />;

    case 'products/new':
      return <ProductFormPage {...commonProps} />;

    case 'products/edit':
      return <ProductFormPage {...commonProps} editProductId={editProductId} />;

    case 'settings':
      return <SettingsPage {...commonProps} />;

    default:
      return <DashboardPage {...commonProps} />;
  }
}
