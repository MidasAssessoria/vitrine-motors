import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useComparisonStore } from '../../stores/comparisonStore';
import { Scale, X } from 'lucide-react';

export function ComparisonBar() {
  const { comparedIds, clearComparison } = useComparisonStore();

  if (comparedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A2E] text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4"
      >
        <Scale size={18} className="text-primary shrink-0" />
        <span className="text-sm font-medium">
          {comparedIds.length} vehiculo{comparedIds.length !== 1 ? 's' : ''} seleccionado{comparedIds.length !== 1 ? 's' : ''}
        </span>

        <Link
          to={`/comparar?ids=${comparedIds.join(',')}`}
          className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          Comparar
        </Link>

        <button
          onClick={clearComparison}
          className="text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
