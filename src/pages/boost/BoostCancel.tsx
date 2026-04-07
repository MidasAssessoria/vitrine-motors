import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { XCircle } from 'lucide-react';

export function BoostCancel() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Container className="flex flex-col items-center text-center py-20 max-w-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-3">
          Pago cancelado
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          No se realizo ningun cobro. Puedes intentar nuevamente cuando quieras.
        </p>
        <div className="flex gap-3">
          <Link to="/dealer/inventory">
            <Button variant="primary">Volver a mi inventario</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
