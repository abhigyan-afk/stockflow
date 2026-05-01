import { useState } from 'react';
import { Boxes, Eye, EyeOff, Building2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { api } from '../lib/api';
import { User } from '../types';

interface SignupPageProps {
  onSignupSuccess: (user: User) => void;
  onGoLogin: () => void;
}

export function SignupPage({ onSignupSuccess, onGoLogin }: SignupPageProps) {
  const [form, setForm] = useState({
    orgName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.orgName.trim()) e.orgName = 'Organization name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await api.auth.signup({
        email: form.email.trim(),
        password: form.password,
        organizationName: form.orgName.trim(),
      });
      onSignupSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength];
  const strengthColor = [
    '',
    'bg-red-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-emerald-400',
    'bg-emerald-500',
  ][strength];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">StockFlow</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Your inventory,<br />under control.
          </h2>
          <p className="text-indigo-200 leading-relaxed">
            Create your free account in seconds. No credit card required. Start managing your products right away.
          </p>
          <ul className="space-y-3">
            {[
              'Create unlimited products & SKUs',
              'Track stock levels in real-time',
              'Get low-stock alerts instantly',
              'Fully isolated per organization',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-indigo-300 text-xs">StockFlow MVP v0.1 — Sign up free today.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-5">
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">StockFlow</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Get started with StockFlow for free.</p>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Org name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Organization name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={form.orgName}
                  onChange={(e) => set('orgName', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {errors.orgName && <p className="text-xs text-red-600">{errors.orgName}</p>}
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength ? strengthColor : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{strengthLabel}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Confirm password</label>
              <div className="relative">
                <input
                  type={showCpw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCpw(!showCpw)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onGoLogin}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
