import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, FileText, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { fetchPendingDocuments, approveDocument, rejectDocument } from '../../lib/documents';
import { useAuthStore } from '../../stores/authStore';
import type { UserDocument } from '../../types';

const DOC_LABELS: Record<string, string> = {
  ci_frente: 'CI Frente',
  ci_verso: 'CI Dorso',
  ruc_doc: 'RUC Documento',
};

export function AdminDocuments() {
  const user = useAuthStore((s) => s.user);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadDocs = async () => {
    setLoading(true);
    const data = await fetchPendingDocuments();
    setDocuments(data);
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, []);

  const handleApprove = async (docId: string) => {
    if (!user) return;
    await approveDocument(docId, user.id);
    loadDocs();
  };

  const handleReject = async () => {
    if (!user || !rejectingId) return;
    await rejectDocument(rejectingId, user.id, rejectReason || undefined);
    setRejectingId(null);
    setRejectReason('');
    loadDocs();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Documentos pendientes</h1>
        <p className="text-sm text-text-secondary mt-1">{documents.length} documentos por revisar</p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <FileText className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Todo al día</h3>
          <p className="text-sm text-text-secondary">No hay documentos pendientes de revisión</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-border p-5 shadow-card flex items-center gap-4">
              {/* Thumbnail */}
              <div
                className="w-20 h-14 rounded-lg bg-bg-secondary overflow-hidden border border-border cursor-pointer shrink-0"
                onClick={() => setPreviewUrl(doc.file_url)}
              >
                <img src={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {(doc.profile as { name?: string })?.name || 'Usuario'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {(doc.profile as { email?: string })?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-bg-secondary text-text-secondary px-2 py-0.5 rounded font-medium">
                    {DOC_LABELS[doc.document_type] || doc.document_type}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(doc.created_at).toLocaleDateString('es-PY')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPreviewUrl(doc.file_url)}
                  className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary cursor-pointer"
                  title="Ver imagen"
                >
                  <Eye size={16} />
                </button>
                <Button
                  onClick={() => handleApprove(doc.id)}
                  className="!bg-success-green hover:!bg-success-green/80 !text-white !px-3 !py-1.5 !text-xs"
                >
                  <CheckCircle2 size={14} className="mr-1" /> Aprobar
                </Button>
                <button
                  onClick={() => setRejectingId(doc.id)}
                  className="px-3 py-1.5 text-xs font-medium text-accent-red bg-accent-red/10 rounded-lg hover:bg-accent-red/20 transition-colors cursor-pointer"
                >
                  <XCircle size={14} className="inline mr-1" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Documento" className="max-w-full max-h-[80vh] rounded-2xl shadow-xl" />
        </div>
      )}

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Rechazar documento</h3>
            <p className="text-sm text-text-secondary mb-4">Opcionalmente indicá el motivo del rechazo. El usuario será notificado.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (opcional)..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm mb-4 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-accent-red hover:bg-accent-red/80 rounded-xl transition-colors cursor-pointer"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
