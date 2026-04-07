import { supabase } from './supabase';
import type { UserDocument, DocumentType } from '../types';
import { createNotification } from './notifications';

export async function uploadDocument(file: File, userId: string, type: DocumentType): Promise<UserDocument | null> {
  if (!supabase) throw new Error('Supabase no configurado');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${type}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('user-documents')
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from('user_documents')
    .insert({ user_id: userId, document_type: type, file_url: publicUrl })
    .select()
    .single();

  if (error) throw error;
  return data as UserDocument;
}

export async function fetchUserDocuments(userId: string): Promise<UserDocument[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as UserDocument[];
}

export async function fetchPendingDocuments(): Promise<UserDocument[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_documents')
    .select('*, profile:profiles(name, email, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) return [];
  return data as UserDocument[];
}

export async function approveDocument(docId: string, adminId: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data: doc } = await supabase
    .from('user_documents')
    .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', docId)
    .select('user_id')
    .single();

  // Se ambos documentos (frente e verso) estão aprovados, marcar profile como verificado
  if (doc) {
    const { data: docs } = await supabase
      .from('user_documents')
      .select('document_type, status')
      .eq('user_id', doc.user_id)
      .in('document_type', ['ci_frente', 'ci_verso']);

    const allApproved = docs && docs.length >= 2 && docs.every((d: { status: string }) => d.status === 'approved');
    if (allApproved) {
      await supabase.from('profiles').update({ document_verified: true }).eq('id', doc.user_id);
      // Notificar usuário que foi verificado
      createNotification({
        userId: doc.user_id,
        type: 'system',
        title: 'Identidad verificada',
        message: 'Tus documentos fueron aprobados. Ya tenés el badge de verificado.',
        link: '/mi-perfil',
      }).catch(() => {});
    }
  }
}

export async function rejectDocument(docId: string, adminId: string, reason?: string) {
  if (!supabase) throw new Error('Supabase no configurado');

  const { data: doc } = await supabase
    .from('user_documents')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', docId)
    .select('user_id')
    .single();

  // Notificar usuário
  if (doc) {
    createNotification({
      userId: doc.user_id,
      type: 'system',
      title: 'Documento rechazado',
      message: reason
        ? `Tu documento fue rechazado: ${reason}. Subí uno nuevo desde tu perfil.`
        : 'Tu documento fue rechazado. Subí uno nuevo desde tu perfil.',
      link: '/mi-perfil',
    }).catch(() => {});
  }
}

export async function isUserDocumentVerified(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase
    .from('profiles')
    .select('document_verified')
    .eq('id', userId)
    .single();
  return data?.document_verified ?? false;
}
