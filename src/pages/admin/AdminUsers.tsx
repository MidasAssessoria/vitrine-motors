import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { fetchAllUsers, updateUserRole } from '../../lib/dealers';
import { formatDate } from '../../utils/formatters';
import type { Profile, Role } from '../../types';

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllUsers().then((data) => { setUsers(data); setLoading(false); });
  }, []);

  const handleRoleChange = async (id: string, role: Role) => {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    await updateUserRole(id, role);
  };

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Usuarios</h1>
          <p className="text-sm text-text-secondary mt-1">{users.length} usuarios registrados</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Rol</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Registro</th>
                <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3">Cambiar rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="buyer">Comprador</option>
                      <option value="seller">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">No se encontraron usuarios</div>
        )}
      </div>
    </div>
  );
}
