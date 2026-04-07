import { create } from 'zustand';
import { toast } from './toastStore';

interface ComparisonStore {
  comparedIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearComparison: () => void;
  isCompared: (id: string) => boolean;
}

const MAX_COMPARE = 3;

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  comparedIds: [],

  addToCompare: (id: string) => {
    const { comparedIds } = get();
    if (comparedIds.length >= MAX_COMPARE) {
      toast.warning(`Máximo ${MAX_COMPARE} vehículos para comparar`);
      return;
    }
    if (comparedIds.includes(id)) return;
    set({ comparedIds: [...comparedIds, id] });
    toast.success('Vehículo agregado a comparación');
  },

  removeFromCompare: (id: string) => {
    set({ comparedIds: get().comparedIds.filter((cid) => cid !== id) });
    toast.info('Vehículo removido de comparación');
  },

  clearComparison: () => {
    set({ comparedIds: [] });
  },

  isCompared: (id: string) => {
    return get().comparedIds.includes(id);
  },
}));
