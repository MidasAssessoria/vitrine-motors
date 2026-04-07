import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Zap } from 'lucide-react';

export function BoostSuccess() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Container className="flex flex-col items-center text-center py-20 max-w-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-3">
          Boost activado exitosamente
        </h1>
        <p className="text-sm text-text-secondary mb-2">
          Tu vehiculo ahora tiene mayor visibilidad en la plataforma.
        </p>
        <div className="flex items-center gap-1.5 text-sm text-primary font-medium mb-8">
          <Zap size={14} />
          <span>El destaque ya esta activo</span>
        </div>
        <div className="flex gap-3">
          <Link to="/dealer/inventory">
            <Button variant="primary">Ver mi inventario</Button>
          </Link>
          <Link to="/comprar">
            <Button variant="outline">Ir a la tienda</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
