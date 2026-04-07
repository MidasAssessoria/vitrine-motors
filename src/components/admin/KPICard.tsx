import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function KPICard({ icon: Icon, label, value, subtitle, trend, className = '' }: KPICardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.positive ? 'bg-success-green/10 text-success-green' : 'bg-accent-red/10 text-accent-red'
          }`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold font-heading text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  );
}
