import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const config = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconClass: 'text-blue-500',
  },
};

export function Alert({ type = 'info', message, onDismiss, className }: AlertProps) {
  const { container, icon: Icon, iconClass } = config[type];
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        container,
        className
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconClass)} />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
