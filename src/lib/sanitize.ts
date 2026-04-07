import DOMPurify from 'dompurify';

/**
 * Sanitiza texto removendo HTML/scripts maliciosos.
 * Retorna apenas texto puro (sem tags HTML).
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Sanitiza texto permitindo formatacao basica (negrito, italico, links).
 * Util para descricoes que podem ter HTML intencional.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Valida que um numero de WhatsApp contem apenas digitos e caracteres permitidos.
 * Formato esperado: +595 9XX XXX XXX ou variantes
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input) return '';
  // Remove tudo exceto digitos, +, espacos e hifens
  return input.replace(/[^\d+\s-]/g, '').trim();
}

/**
 * Valida MIME type de arquivo para upload de fotos.
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}. Solo se aceptan: JPEG, PNG, WebP, AVIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}
