/**
 * impersonationStore — contexto de impersonação admin → dealer
 *
 * Persiste em sessionStorage: limpa ao fechar o browser/aba.
 * Só admins podem ativar. O DealerLayout lê esse store para
 * exibir o banner e ajustar qual dealer_id é usado nas queries.
 */

import { create } from 'zustand';

interface ImpersonatedDealer {
  id: string;
  name: string;
}

interface ImpersonationState {
  impersonating: ImpersonatedDealer | null;
  start: (dealer: ImpersonatedDealer) => void;
  stop: () => void;
}

const SESSION_KEY = 'vm_impersonating';

function loadFromSession(): ImpersonatedDealer | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ImpersonatedDealer) : null;
  } catch {
    return null;
  }
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  impersonating: loadFromSession(),

  start: (dealer) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(dealer));
    set({ impersonating: dealer });
  },

  stop: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ impersonating: null });
  },
}));
