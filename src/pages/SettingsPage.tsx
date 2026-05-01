import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, User as UserIcon, Shield } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { User, AppRoute } from '../types';

interface SettingsPageProps {
  user: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export function SettingsPage({ user, currentRoute, onNavigate, onLogout }: SettingsPageProps) {
  const [threshold, setThreshold] = useState('5');
  const [thresholdError, setThresholdError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSettings(true);
    setLoadError('');
    api.settings
      .get()
      .then((s) => {
        if (!cancelled) setThreshold(String(s.defaultLowStockThreshold));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load settings.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.organizationId]);

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaveSuccess('');
    setThresholdError('');
    const val = parseInt(threshold);
    if (isNaN(val) || val < 0) {
      setThresholdError('Must be a non-negative integer.');
      return;
    }
    setSaveLoading(true);
    try {
      await api.settings.save({ defaultLowStockThreshold: val });
      setSaveSuccess('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setThresholdError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AppLayout
      user={user}
      currentRoute={currentRoute}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Settings"
    >
      <div className="max-w-2xl mx-auto space-y-5">
        {saveSuccess && <Alert type="success" message={saveSuccess} onDismiss={() => setSaveSuccess('')} />}
        {loadError && <Alert type="error" message={loadError} onDismiss={() => setLoadError('')} />}
        {loadingSettings && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Loading settings from API…
          </div>
        )}

        {/* Org info */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Organization</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Name</p>
              <p className="text-sm font-semibold text-slate-800">{user.organizationName}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Org ID</p>
              <p className="text-xs font-mono text-slate-600 truncate">{user.organizationId}</p>
            </div>
          </div>
        </Card>

        {/* User info */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <UserIcon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Account</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-slate-800">{user.email}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Role</p>
              <p className="text-sm font-semibold text-slate-800">Owner / Admin</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Member since</p>
            <p className="text-sm text-slate-800">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <SettingsIcon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Inventory Settings</h3>
          </div>
          <form onSubmit={handleSave} noValidate>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Default low stock threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(e.target.value);
                      setThresholdError('');
                    }}
                    className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="text-sm text-slate-500">units</span>
                </div>
                {thresholdError && <p className="text-xs text-red-600">{thresholdError}</p>}
                <p className="text-xs text-slate-400 max-w-md">
                  Products whose Quantity on Hand is at or below this number will appear as
                  "Low Stock" on the Dashboard and Products list. Individual products can
                  override this value.
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saveLoading} leftIcon={<Save className="h-4 w-4" />}>
                  Save settings
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Tech info (dev-only note) */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Architecture (MVP Notes)</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="rounded-lg bg-slate-50 px-4 py-3 space-y-2 font-mono">
              <p>Frontend: React 19 + Vite + Tailwind CSS 4</p>
              <p>State: Backend REST API + persisted JWT session</p>
              <p>Auth: JWT bearer tokens + bcrypt password hashing</p>
              <p>Backend: Node.js + Express + Prisma + SQLite</p>
              <p>Multi-tenant: Data scoped by organizationId</p>
            </div>
            <p className="text-slate-400">
              ✅ Data operations now go through the authenticated REST API. For production,
              rotate JWT secrets, add refresh-token/session controls, and use HTTPS.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
