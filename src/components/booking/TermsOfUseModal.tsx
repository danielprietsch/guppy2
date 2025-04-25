
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUseModal = ({ isOpen, onClose }: TermsOfUseModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Termos de Uso</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm">
          <h2 className="text-lg font-semibold">1. Termos Gerais</h2>
          <p>
            Ao acessar e utilizar este serviço de reserva de cabines, você concorda com os seguintes termos e condições.
          </p>
          
          <h2 className="text-lg font-semibold">2. Reservas</h2>
          <p>
            2.1. As reservas estão sujeitas à disponibilidade e confirmação.
          </p>
          <p>
            2.2. Os preços podem variar de acordo com a temporada e demanda.
          </p>
          
          <h2 className="text-lg font-semibold">3. Cancelamentos</h2>
          <p>
            3.1. Cancelamentos devem ser realizados com antecedência mínima conforme política do estabelecimento.
          </p>
          <p>
            3.2. Reembolsos serão processados de acordo com a política de cancelamento vigente.
          </p>
          
          <h2 className="text-lg font-semibold">4. Responsabilidades</h2>
          <p>
            4.1. O usuário é responsável por fornecer informações precisas e verdadeiras.
          </p>
          <p>
            4.2. O estabelecimento se reserva o direito de recusar serviço a qualquer momento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
