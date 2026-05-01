import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { api } from '../lib/api';
import { User, Product, AppRoute, Settings } from '../types';

interface ProductsPageProps {
  user: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, productId?: string) => void;
  onLogout: () => void;
}

type SortKey = 'name' | 'sku' | 'quantityOnHand' | 'sellingPrice';

export function ProductsPage({ user, currentRoute, onNavigate, onLogout }: ProductsPageProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Stock adjust modal
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [refresh, setRefresh] = useState(0);
  const [settings, setSettings] = useState<Settings>({ defaultLowStockThreshold: 5 });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setLoadError('');
    Promise.all([api.products.list(), api.settings.get()])
      .then(([nextProducts, nextSettings]) => {
        if (cancelled) return;
        setAllProducts(nextProducts);
        setSettings(nextSettings);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.organizationId, refresh]);

  const products = useMemo(() => {
    let list = [...allProducts];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      list = list.filter((p) => {
        const threshold = p.lowStockThreshold ?? settings.defaultLowStockThreshold;
        const isLow = p.quantityOnHand <= threshold;
        return filterStatus === 'low' ? isLow : !isLow;
      });
    }

    // Sort
    list.sort((a, b) => {
      let av: string | number = a[sortKey] ?? 0;
      let bv: string | number = b[sortKey] ?? 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [allProducts, search, sortKey, sortDir, filterStatus, settings]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (col !== sortKey) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.products.delete(deleteTarget.id);
      setDeleteTarget(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAdjust = async () => {
    setAdjustError('');
    const n = parseInt(adjustDelta, 10);
    if (isNaN(n) || adjustDelta.trim() === '') {
      setAdjustError('Enter a valid integer (e.g., +5 or -3).');
      return;
    }
    if (!adjustTarget) return;
    setAdjustLoading(true);
    try {
      const product = await api.products.adjust(adjustTarget.id, n, adjustNote);
      setAdjustSuccess(`Stock updated! New qty: ${product.quantityOnHand}`);
      setAdjustDelta('');
      setAdjustNote('');
      setRefresh((r) => r + 1);
      setTimeout(() => {
        setAdjustTarget(null);
        setAdjustSuccess('');
      }, 1500);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Adjustment failed.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const lowCount = allProducts.filter((p) => {
    const t = p.lowStockThreshold ?? settings.defaultLowStockThreshold;
    return p.quantityOnHand <= t;
  }).length;

  return (
    <AppLayout
      user={user}
      currentRoute={currentRoute}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Products"
      pageActions={
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => onNavigate('products/new')}
        >
          Add product
        </Button>
      }
    >
      {loadError && <Alert type="error" message={loadError} onDismiss={() => setLoadError('')} className="mb-5" />}
      {loadingProducts && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading products from API…
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden text-sm">
            {([['all', 'All'], ['low', `Low (${lowCount})`], ['ok', 'In Stock']] as const).map(
              ([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filterStatus === val
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="rounded-full bg-slate-100 p-5 mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">
              {search || filterStatus !== 'all' ? 'No matching products' : 'No products yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1 mb-5">
              {search || filterStatus !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Add your first product to get started.'}
            </p>
            {!search && filterStatus === 'all' && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => onNavigate('products/new')}
              >
                Add product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {([
                    { key: 'name', label: 'Product' },
                    { key: 'sku', label: 'SKU' },
                    { key: 'quantityOnHand', label: 'Qty on Hand' },
                    { key: 'sellingPrice', label: 'Selling Price' },
                  ] as { key: SortKey; label: string }[]).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="cursor-pointer select-none px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-800 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label} <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product) => {
                  const threshold = product.lowStockThreshold ?? settings.defaultLowStockThreshold;
                  const isLow = product.quantityOnHand <= threshold;
                  const isOut = product.quantityOnHand === 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                            }`}
                          >
                            {product.quantityOnHand}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustTarget(product);
                              setAdjustDelta('');
                              setAdjustNote('');
                              setAdjustError('');
                              setAdjustSuccess('');
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-indigo-50 p-1 text-indigo-600 hover:bg-indigo-100"
                            title="Adjust stock"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Threshold: {threshold}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {product.sellingPrice != null ? (
                          <span>${product.sellingPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {product.costPrice != null && (
                          <div className="text-[10px] text-slate-400">Cost: ${product.costPrice.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isOut ? (
                          <Badge variant="danger">Out of stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low stock</Badge>
                        ) : (
                          <Badge variant="success">In stock</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil className="h-3.5 w-3.5" />}
                            onClick={() => onNavigate('products/edit', product.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                            onClick={() => {
                              setDeleteTarget(product);
                              setDeleteError('');
                            }}
                            className="text-red-500 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {products.length > 0 && (
        <p className="mt-3 text-xs text-slate-400 text-right">
          Showing {products.length} of {allProducts.length} products
        </p>
      )}

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-800">{deleteTarget?.name}</span>? This action
            cannot be undone.
          </p>
          {deleteError && <Alert type="error" message={deleteError} />}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
              Delete product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock adjust modal */}
      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title="Adjust stock"
        size="sm"
      >
        {adjustTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Product</p>
              <p className="font-semibold text-slate-800">{adjustTarget.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{adjustTarget.sku}</p>
              <p className="text-sm text-slate-600 mt-1">
                Current quantity:{' '}
                <span className="font-bold text-slate-800">{adjustTarget.quantityOnHand}</span>
              </p>
            </div>

            {adjustSuccess ? (
              <Alert type="success" message={adjustSuccess} />
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Adjustment amount
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustDelta((v) => String((parseInt(v || '0') || 0) - 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      placeholder="e.g. +5 or -3"
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-center font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustDelta((v) => String((parseInt(v || '0') || 0) + 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {adjustDelta && !isNaN(parseInt(adjustDelta)) && (
                    <p className="text-xs text-slate-500">
                      New quantity:{' '}
                      <span className="font-semibold text-slate-800">
                        {Math.max(0, adjustTarget.quantityOnHand + parseInt(adjustDelta))}
                      </span>
                    </p>
                  )}
                  {adjustError && <p className="text-xs text-red-600">{adjustError}</p>}
                </div>

                <Input
                  label="Note (optional)"
                  placeholder="e.g. Received new shipment"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />

                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setAdjustTarget(null)}>
                    Cancel
                  </Button>
                  <Button loading={adjustLoading} onClick={handleAdjust}>
                    Apply adjustment
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
