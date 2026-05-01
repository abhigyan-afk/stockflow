import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { User, AppRoute, ProductFormData, Settings } from '../types';

interface ProductFormPageProps {
  user: User;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  editProductId?: string;
}

const EMPTY: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  quantityOnHand: '0',
  costPrice: '',
  sellingPrice: '',
  lowStockThreshold: '',
};

export function ProductFormPage({
  user,
  currentRoute,
  onNavigate,
  onLogout,
  editProductId,
}: ProductFormPageProps) {
  const isEditing = !!editProductId;
  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [settings, setSettings] = useState<Settings>({ defaultLowStockThreshold: 5 });

  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);
    setSubmitError('');

    const requests: Promise<unknown>[] = [api.settings.get()];
    if (isEditing && editProductId) requests.push(api.products.get(editProductId));

    Promise.all(requests)
      .then(([nextSettings, product]) => {
        if (cancelled) return;
        setSettings(nextSettings as Settings);
        if (product) {
          const p = product as Awaited<ReturnType<typeof api.products.get>>;
          setForm({
            name: p.name,
            sku: p.sku,
            description: p.description ?? '',
            quantityOnHand: String(p.quantityOnHand),
            costPrice: p.costPrice != null ? String(p.costPrice) : '',
            sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : '',
            lowStockThreshold: p.lowStockThreshold != null ? String(p.lowStockThreshold) : '',
          });
        } else {
          setForm(EMPTY);
        }
      })
      .catch((err) => {
        if (!cancelled) setSubmitError(err instanceof Error ? err.message : 'Failed to load product form.');
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, editProductId, user.organizationId]);

  const set = (key: keyof ProductFormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<ProductFormData> = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    if (!form.sku.trim()) e.sku = 'SKU is required.';
    if (form.quantityOnHand.trim() === '') {
      e.quantityOnHand = 'Quantity is required.';
    } else if (
      isNaN(parseInt(form.quantityOnHand)) ||
      parseInt(form.quantityOnHand) < 0
    ) {
      e.quantityOnHand = 'Quantity must be a non-negative integer.';
    }
    if (form.costPrice && isNaN(parseFloat(form.costPrice))) {
      e.costPrice = 'Must be a valid number.';
    }
    if (form.sellingPrice && isNaN(parseFloat(form.sellingPrice))) {
      e.sellingPrice = 'Must be a valid number.';
    }
    if (form.lowStockThreshold && isNaN(parseInt(form.lowStockThreshold))) {
      e.lowStockThreshold = 'Must be a valid integer.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      description: form.description.trim(),
      quantityOnHand: parseInt(form.quantityOnHand),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
      sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : null,
      lowStockThreshold: form.lowStockThreshold ? parseInt(form.lowStockThreshold) : null,
    };

    setLoading(true);
    try {
      if (isEditing && editProductId) {
        await api.products.update(editProductId, payload);
        setSubmitSuccess('Product updated successfully!');
      } else {
        await api.products.create(payload);
        setSubmitSuccess('Product created successfully!');
      }
      setTimeout(() => onNavigate('products'), 1000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : isEditing ? 'Failed to update product.' : 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      user={user}
      currentRoute={currentRoute}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle={isEditing ? 'Edit Product' : 'Add Product'}
      pageActions={
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => onNavigate('products')}
        >
          Back to products
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto">
        {loadingInitial && (
          <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Loading product data from API…
          </div>
        )}
        {submitError && (
          <Alert
            type="error"
            message={submitError}
            onDismiss={() => setSubmitError('')}
            className="mb-5"
          />
        )}
        {submitSuccess && (
          <Alert type="success" message={submitSuccess} className="mb-5" />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Basic Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Package className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Basic Information</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product name *"
                  placeholder="e.g. Blue T-Shirt"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  error={errors.name}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g. TSH-BLUE-L"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                  />
                  {errors.sku && <p className="text-xs text-red-600">{errors.sku}</p>}
                  <p className="text-xs text-slate-400">Unique per organization. Auto-uppercased.</p>
                </div>
              </div>
              <Textarea
                label="Description"
                placeholder="Optional short description…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </Card>

          {/* Inventory */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Inventory</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity on hand *"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.quantityOnHand}
                onChange={(e) => set('quantityOnHand', e.target.value)}
                error={errors.quantityOnHand}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Low stock threshold</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`Default: ${settings.defaultLowStockThreshold}`}
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.lowStockThreshold && (
                  <p className="text-xs text-red-600">{errors.lowStockThreshold}</p>
                )}
                <p className="text-xs text-slate-400">
                  Leave blank to use org default ({settings.defaultLowStockThreshold}).
                </p>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Pricing <span className="text-slate-400 font-normal">(optional)</span></h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cost price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                error={errors.costPrice}
                leftAddon="$"
              />
              <Input
                label="Selling price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.sellingPrice}
                onChange={(e) => set('sellingPrice', e.target.value)}
                error={errors.sellingPrice}
                leftAddon="$"
              />
            </div>
            {form.costPrice && form.sellingPrice && parseFloat(form.costPrice) > 0 && (
              <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                <span className="text-slate-500">Margin: </span>
                <span className="font-semibold text-emerald-600">
                  {(
                    ((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) /
                      parseFloat(form.costPrice)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
                <span className="text-slate-400 text-xs ml-2">
                  (${(parseFloat(form.sellingPrice) - parseFloat(form.costPrice)).toFixed(2)} per unit)
                </span>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onNavigate('products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {isEditing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
