import { useState } from 'react';
import { Boxes, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { api } from '../lib/api';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onGoSignup: () => void;
}

export function LoginPage({ onLogin, onGoSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await api.auth.login({ email: email.trim(), password });
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo quick-fill
  const fillDemo = () => {
    setEmail('demo@stockflow.io');
    setPassword('demo1234');
    setErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">StockFlow</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
              ✦ Inventory Management MVP
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Take control of your inventory, effortlessly.
            </h2>
            <p className="text-indigo-200 text-base leading-relaxed">
              Track products, monitor stock levels, and get instant alerts when you're running low—all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Products', value: '2.4k+' },
              { label: 'Low Stock Alerts', value: 'Real-time' },
              { label: 'Organizations', value: 'Multi-tenant' },
              { label: 'Data Security', value: 'Org-scoped' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-3">
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-indigo-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-300 text-xs">StockFlow MVP v0.1 — Built for speed.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">StockFlow</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your StockFlow account.</p>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-slate-50 px-2">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={fillDemo}
          >
            🎯 Fill Demo Credentials
          </Button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={onGoSignup}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
