import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizePhoneNumber, validateImageFile } from '../sanitize';

describe('sanitizeText', () => {
  it('remove scripts maliciosos', () => {
    expect(sanitizeText('<script>alert("xss")</script>Texto limpo')).toBe('Texto limpo');
  });

  it('remove tags HTML', () => {
    expect(sanitizeText('<b>Bold</b> <div>div</div>')).toBe('Bold div');
  });

  it('mantem texto puro', () => {
    expect(sanitizeText('Toyota Hilux 2023 4x4 - Excelente estado!')).toBe('Toyota Hilux 2023 4x4 - Excelente estado!');
  });

  it('retorna vazio para input vazio', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('remove event handlers', () => {
    expect(sanitizeText('<img onerror="alert(1)" src="x">')).toBe('');
  });

  it('remove iframes', () => {
    expect(sanitizeText('<iframe src="evil.com"></iframe>Normal')).toBe('Normal');
  });
});

describe('sanitizePhoneNumber', () => {
  it('mantem formato valido paraguaio', () => {
    expect(sanitizePhoneNumber('+595 981 123 456')).toBe('+595 981 123 456');
  });

  it('remove caracteres invalidos', () => {
    expect(sanitizePhoneNumber('+595<script>981')).toBe('+595981');
  });

  it('mantem hifens', () => {
    expect(sanitizePhoneNumber('0981-123-456')).toBe('0981-123-456');
  });

  it('retorna vazio para input vazio', () => {
    expect(sanitizePhoneNumber('')).toBe('');
  });
});

describe('validateImageFile', () => {
  it('aceita JPEG', () => {
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it('aceita PNG', () => {
    const file = new File(['content'], 'photo.png', { type: 'image/png' });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it('aceita WebP', () => {
    const file = new File(['content'], 'photo.webp', { type: 'image/webp' });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it('rejeita PDF', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('no permitido');
  });

  it('rejeita executavel', () => {
    const file = new File(['content'], 'virus.exe', { type: 'application/x-msdownload' });
    expect(validateImageFile(file).valid).toBe(false);
  });

  it('rejeita arquivo muito grande', () => {
    // Simular arquivo de 15MB
    const bigContent = new Uint8Array(15 * 1024 * 1024);
    const file = new File([bigContent], 'big.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('muy grande');
  });
});
