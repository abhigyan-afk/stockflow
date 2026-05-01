import { useEffect, useMemo, useState } from 'react';
import { Package, Layers, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { User, AppRoute, DashboardSummary, Product, Settings } from '../types';

interface DashboardPageProps {
  user: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export function DashboardPage({ user, currentRoute, onNavigate, onLogout }: DashboardPageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({ defaultLowStockThreshold: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([api.dashboard.get(), api.products.list(), api.settings.get()])
      .then(([nextSummary, nextProducts, nextSettings]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setProducts(nextProducts);
        setSettings(nextSettings);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.organizationId]);

  const recentProducts = useMemo(
    () => [...products]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
    [products]
  );

  const totalValue = summary?.inventoryValue ?? products.reduce((sum, p) => {
    if (p.sellingPrice != null) return sum + p.sellingPrice * p.quantityOnHand;
    return sum;
  }, 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <AppLayout
      user={user}
      currentRoute={currentRoute}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Dashboard"
    >
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !summary && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading dashboard from API…
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {greeting}, {user.email.split('@')[0]}! 👋
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Here's what's happening with <span className="font-medium text-slate-700">{user.organizationName}</span> today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Products"
          value={summary?.totalProducts ?? 0}
          subtitle="SKUs in catalog"
          icon={<Package className="h-5 w-5" />}
          color="indigo"
        />
        <StatCard
          title="Total Units"
          value={(summary?.totalQuantity ?? 0).toLocaleString()}
          subtitle="Across all products"
          icon={<Layers className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={summary?.lowStockCount ?? 0}
          subtitle={(summary?.lowStockCount ?? 0) > 0 ? 'Needs attention' : 'All levels healthy'}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={(summary?.lowStockCount ?? 0) > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          title="Inventory Value"
          value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Based on selling price"
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low stock table */}
        <Card padding="none">
          <div className="p-5">
            <CardHeader className="mb-0 pb-0 border-b-0">
              <div className="flex items-center gap-2">
                <CardTitle>Low Stock Alerts</CardTitle>
                {(summary?.lowStockCount ?? 0) > 0 && (
                  <Badge variant="danger">{summary?.lowStockCount ?? 0}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigate('products')}
              >
                View all
              </Button>
            </CardHeader>
          </div>
          {(summary?.lowStockItems ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="rounded-full bg-emerald-50 p-4 mb-3">
                <Package className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">All stock levels healthy!</p>
              <p className="text-xs text-slate-400 mt-1">No products are below their low stock threshold.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(summary?.lowStockItems ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-red-50/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {item.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-bold ${
                            item.quantityOnHand === 0
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.quantityOnHand}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">{item.lowStockThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent products */}
        <Card padding="none">
          <div className="p-5">
            <CardHeader className="mb-0 pb-0 border-b-0">
              <CardTitle>Recently Updated</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onNavigate('products')}
              >
                All products
              </Button>
            </CardHeader>
          </div>
          {recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="rounded-full bg-indigo-50 p-4 mb-3">
                <Package className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No products yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Create your first product to see it here.</p>
              <Button size="sm" onClick={() => onNavigate('products/new')}>
                Add product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentProducts.map((product) => {
                    const threshold = product.lowStockThreshold ?? settings.defaultLowStockThreshold;
                    const isLow = product.quantityOnHand <= threshold;
                    const isOut = product.quantityOnHand === 0;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{product.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-700">
                          {product.quantityOnHand}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-500">
                          {product.sellingPrice != null ? `$${product.sellingPrice.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isOut ? (
                            <Badge variant="danger">Out of stock</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Low stock</Badge>
                          ) : (
                            <Badge variant="success">In stock</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
