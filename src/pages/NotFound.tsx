import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Car, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Container className="flex flex-col items-center text-center py-20">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-light mb-6">
          <Car className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-3">
          404
        </h1>
        <p className="text-lg text-text-secondary mb-8 max-w-md">
          La pagina que buscas no existe o fue movida a otra direccion.
        </p>
        <Link to="/">
          <Button variant="primary">
            <ArrowLeft size={16} className="mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </Container>
    </div>
  );
}
