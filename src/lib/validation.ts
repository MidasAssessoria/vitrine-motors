import { z } from 'zod';

// ─── Helpers ───

const phoneRegex = /^[+]?\d[\d\s-]{6,17}$/;

const phone = z
  .string()
  .min(7, 'El teléfono debe tener al menos 7 dígitos')
  .max(20, 'El teléfono es demasiado largo')
  .regex(phoneRegex, 'Formato de teléfono inválido');

const email = z
  .string()
  .email('Email inválido')
  .max(255, 'Email demasiado largo');

const safeText = (min: number, max: number, label: string) =>
  z
    .string()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar ${max} caracteres`);

// ─── Login ───

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Registro ───

export const registerBaseSchema = z.object({
  name: safeText(2, 100, 'El nombre'),
  email: email,
  phone: phone,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128, 'Contraseña demasiado larga'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const registerDealerSchema = registerBaseSchema.and(
  z.object({
    companyName: safeText(2, 200, 'El nombre de la empresa'),
    ruc: safeText(3, 30, 'El RUC'),
    address: z.string().max(300, 'Dirección demasiado larga').optional().or(z.literal('')),
    city: z.string().min(1, 'Seleccioná una ciudad'),
  })
);

export type RegisterBaseInput = z.infer<typeof registerBaseSchema>;
export type RegisterDealerInput = z.infer<typeof registerDealerSchema>;

// ─── Contato / Lead ───

export const contactFormSchema = z.object({
  name: safeText(2, 100, 'El nombre'),
  phone: phone,
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  message: z.string().max(1000, 'El mensaje no puede superar 1000 caracteres').optional().or(z.literal('')),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ─── Publicacao de Veiculo (campos de texto que precisam validacao) ───

export const listingTextSchema = z.object({
  title: safeText(5, 150, 'El título'),
  description: safeText(20, 5000, 'La descripción'),
  city: z.string().min(1, 'Seleccioná una ciudad'),
  department: z.string().optional().or(z.literal('')),
  whatsapp_contact: phone,
  price_usd: z.number().min(1, 'El precio debe ser mayor a 0').max(9999999, 'Precio inválido'),
  year: z.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  mileage: z.number().min(0, 'Kilometraje inválido').max(9999999, 'Kilometraje inválido'),
});

export type ListingTextInput = z.infer<typeof listingTextSchema>;

// ─── Perfil ───

export const profileEditSchema = z.object({
  name: safeText(2, 100, 'El nombre'),
  phone: phone.optional().or(z.literal('')),
  whatsapp: phone.optional().or(z.literal('')),
  bio: z.string().max(500, 'La bio no puede superar 500 caracteres').optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
});

export type ProfileEditInput = z.infer<typeof profileEditSchema>;

// ─── Review ───

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Seleccioná al menos 1 estrella').max(5),
  comment: safeText(5, 1000, 'El comentario'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ─── Helper: extrair erros Zod para exibicao ───

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Datos inválidos';
}
