import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const sections = [
  { title: 'Aceptacion de los Terminos', body: 'Al acceder y utilizar VitrineMotors, usted acepta estar sujeto a estos terminos y condiciones. Si no esta de acuerdo con alguno de estos terminos, no utilice la plataforma.' },
  { title: 'Descripcion del Servicio', body: 'VitrineMotors es una plataforma de marketplace automotriz que conecta compradores y vendedores de vehiculos en Paraguay. Facilitamos la publicacion de anuncios y la comunicacion entre las partes.' },
  { title: 'Registro y Cuenta', body: 'Para publicar vehiculos o acceder a funciones avanzadas, debera crear una cuenta proporcionando informacion veraz y actualizada. Usted es responsable de mantener la confidencialidad de su contrasena.' },
  { title: 'Publicacion de Anuncios', body: 'Los vendedores son responsables de la veracidad de la informacion publicada. VitrineMotors se reserva el derecho de rechazar, pausar o eliminar anuncios que no cumplan con nuestras politicas.' },
  { title: 'Responsabilidad', body: 'VitrineMotors actua como intermediario y no es parte de las transacciones entre compradores y vendedores. No garantizamos la calidad, seguridad o legalidad de los vehiculos publicados.' },
  { title: 'Servicios Premium (Boost)', body: 'Los servicios de destacado (Gold, Silver) son opcionales y estan sujetos al pago correspondiente. Los precios y condiciones estan detallados en cada paquete al momento de la compra.' },
  { title: 'Propiedad Intelectual', body: 'Todo el contenido de la plataforma, incluyendo diseno, logos y funcionalidades, son propiedad de VitrineMotors. Las fotos e informacion de los anuncios pertenecen a sus respectivos autores.' },
  { title: 'Modificaciones', body: 'Nos reservamos el derecho de modificar estos terminos en cualquier momento. Los cambios seran notificados a traves de la plataforma.' },
];

export function TerminosServicio() {
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
            Terminos y Condiciones de Uso
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
