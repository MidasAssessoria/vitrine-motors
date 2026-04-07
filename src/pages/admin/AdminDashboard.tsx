import { useState, useEffect } from 'react';
import { Car, Users, Building2, Eye, TrendingUp, Clock, Star, Loader2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KPICard } from '../../components/admin/KPICard';
import { fetchSystemKPIs } from '../../lib/analytics';
import type { SystemKPIs } from '../../types';

export function AdminDashboard() {
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemKPIs().then((data) => {
      setKpis(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const k = kpis!;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Visión general del sistema</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard icon={Car} label="Total anuncios" value={k.totalListings} />
        <KPICard icon={Star} label="Activos" value={k.activeListings} subtitle={`${k.pendingListings} pendientes`} />
        <KPICard icon={Users} label="Usuarios" value={k.totalUsers} />
        <KPICard icon={Building2} label="Concesionarias" value={k.totalDealers} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard icon={TrendingUp} label="Leads totales" value={k.totalLeads} />
        <KPICard icon={TrendingUp} label="Leads últimos 7 días" value={k.leadsLast7d} />
        <KPICard icon={Eye} label="Views últimos 7 días" value={k.viewsLast7d.toLocaleString()} />
        <KPICard icon={Clock} label="Pendientes aprobación" value={k.pendingListings} />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/admin/listings" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/50 transition-all">
            <Car className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">Gestionar anuncios</p>
              <p className="text-xs text-text-secondary">{k.pendingListings} pendientes de aprobación</p>
            </div>
          </Link>
          <Link to="/admin/dealers" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/50 transition-all">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">Concesionarias</p>
              <p className="text-xs text-text-secondary">Aprobar y verificar</p>
            </div>
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/50 transition-all">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">Usuarios</p>
              <p className="text-xs text-text-secondary">Gestionar roles y accesos</p>
            </div>
          </Link>
          <Link to="/admin/financiero" className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/50 transition-all">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">Financiero</p>
              <p className="text-xs text-text-secondary">MRR, ARR y suscripciones</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
