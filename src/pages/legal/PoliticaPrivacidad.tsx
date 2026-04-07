import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const sections = [
  { title: 'Informacion que Recopilamos', body: 'Recopilamos la informacion que usted nos proporciona al crear una cuenta: nombre, correo electronico, telefono y datos de vehiculos publicados. Tambien recopilamos datos de uso de la plataforma de forma anonima.' },
  { title: 'Uso de la Informacion', body: 'Utilizamos su informacion para: operar la plataforma, conectar compradores con vendedores, enviar notificaciones relevantes, mejorar nuestros servicios y prevenir fraudes.' },
  { title: 'Compartir Informacion', body: 'No vendemos su informacion personal. Solo compartimos datos necesarios para facilitar las transacciones (por ejemplo, datos de contacto del vendedor con compradores interesados).' },
  { title: 'Almacenamiento y Seguridad', body: 'Sus datos se almacenan en servidores seguros con encriptacion. Utilizamos Supabase como proveedor de infraestructura, que cumple con estandares internacionales de seguridad.' },
  { title: 'Cookies y Tecnologias Similares', body: 'Utilizamos almacenamiento local del navegador para mantener su sesion y preferencias. No utilizamos cookies de terceros con fines publicitarios.' },
  { title: 'Sus Derechos', body: 'Usted tiene derecho a acceder, rectificar o eliminar su informacion personal en cualquier momento desde la configuracion de su cuenta, o contactandonos directamente.' },
  { title: 'Contacto', body: 'Para consultas sobre privacidad, puede contactarnos a traves de nuestro formulario de contacto o por WhatsApp.' },
];

export function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero header */}
      <div className="bg-bg-secondary bg-noise py-12 md:py-16">
        <Container className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-3xl font-heading font-bold text-text-primary"
          >
            Politica de Privacidad
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-sm text-text-secondary mt-2"
          >
            Ultima actualizacion: Marzo 2026
          </motion.p>
        </Container>
      </div>

      <Container className="py-8 md:py-12 max-w-3xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-4"
        >
          {sections.map((section, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="bg-white rounded-2xl border border-border p-6 shadow-card"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-base font-heading font-bold text-text-primary mb-2">{section.title}</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{section.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
