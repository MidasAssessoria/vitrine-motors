/**
 * TeamManager — gerenciamento de equipe da concessionária (Platinum).
 * Requer migration 021_dealer_members.sql no Supabase.
 *
 * Permissões seguem src/lib/userIdentity.ts:
 *   dealer_owner e dealer_member(admin) podem convidar/remover.
 *   dealer_member(sales/viewer) só visualiza.
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Crown, Loader2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DealerRole } from '../../lib/userIdentity';

interface TeamMember {
  id: string;
  user_id: string;
  dealer_role: DealerRole;
  created_at: string;
  profile?: { name: string; email: string; avatar_url: string };
}

const ROLE_LABELS: Record<DealerRole, string> = {
  admin:  'Admin',
  sales:  'Vendedor',
  viewer: 'Visualizador',
};

const ROLE_COLORS: Record<DealerRole, string> = {
  admin:  'bg-purple-100 text-purple-700',
  sales:  'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

interface Props {
  dealershipId: string;
  isPlatinum: boolean;
  canManage: boolean;
}

export function TeamManager({ dealershipId, isPlatinum, canManage }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<DealerRole>('sales');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!supabase || !isPlatinum) { setLoading(false); return; }
    supabase
      .from('dealer_members')
      .select('*, profile:profiles(name, email, avatar_url)')
      .eq('dealership_id', dealershipId)
      .order('created_at')
      .then(({ data }) => {
        setMembers((data ?? []) as TeamMember[]);
        setLoading(false);
      });
  }, [dealershipId, isPlatinum]);

  const handleInvite = async () => {
    if (!supabase || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');

    // Buscar user pelo email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', inviteEmail.trim().toLowerCase())
      .single();

    if (!profile) {
      setInviteError('No se encontró un usuario con ese email en VitrineMOTORS.');
      setInviting(false);
      return;
    }

    const { data: member, error } = await supabase
      .from('dealer_members')
      .insert({ dealership_id: dealershipId, user_id: profile.id, dealer_role: inviteRole })
      .select('*, profile:profiles(name, email, avatar_url)')
      .single();

    if (error) {
      setInviteError(error.code === '23505' ? 'Este usuario ya es miembro.' : 'Error al invitar.');
    } else if (member) {
      setMembers((p) => [...p, member as TeamMember]);
      setInviteEmail('');
    }
    setInviting(false);
  };

  const handleRemove = async (memberId: string) => {
    if (!supabase) return;
    await supabase.from('dealer_members').delete().eq('id', memberId);
    setMembers((p) => p.filter((m) => m.id !== memberId));
  };

  // ─── Platinum gate ────────────────────────────────────────────────────────

  if (!isPlatinum) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-text-secondary" />
          <h2 className="text-sm font-bold text-text-primary">Gestión de equipo</h2>
        </div>
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Función exclusiva Platinum</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Invitá vendedores y administradores a tu equipo. Disponible en el plan Platinum.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4 text-text-secondary" />
        <h2 className="text-sm font-bold text-text-primary">Equipo</h2>
        <span className="ml-1 flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
          <Crown className="w-3 h-3" /> Platinum
        </span>
      </div>

      {/* Invite form */}
      {canManage && (
        <div className="mb-5 p-4 bg-bg-secondary rounded-xl space-y-3">
          <p className="text-xs font-semibold text-text-secondary">Invitar miembro</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@usuario.com"
              className="flex-1 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as DealerRole)}
              className="text-xs border border-border rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {(Object.keys(ROLE_LABELS) as DealerRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Invitar
            </button>
          </div>
          {inviteError && <p className="text-xs text-accent-red">{inviteError}</p>}
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : members.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-4">
          Todavía no hay miembros en el equipo
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {(m.profile?.name ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{m.profile?.name ?? '—'}</p>
                <p className="text-xs text-text-secondary truncate">{m.profile?.email}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.dealer_role]}`}>
                {ROLE_LABELS[m.dealer_role]}
              </span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                  title="Remover miembro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
