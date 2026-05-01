import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue';
  trend?: { value: string; up: boolean };
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
};

export function StatCard({ title, value, subtitle, icon, color = 'indigo', trend }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn('rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col gap-3')}>
      <div className="flex items-start justify-between">
        <div className={cn('rounded-lg p-2.5', colors.icon)}>{icon}</div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}
          >
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <div className={cn('text-2xl font-bold tracking-tight', colors.value)}>{value}</div>
        <div className="text-sm font-medium text-slate-600 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
