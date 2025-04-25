
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Cabin, Location } from "@/lib/types";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { debugBooking } from "@/utils/debugLogger";

interface BookingSummaryProps {
  cabin: Cabin | null;
  locationData: Location | null;
  selectedTurns: { [date: string]: string[] };
  subtotalTurns: number;
  serviceFee: number;
  total: number;
  acceptTerms: boolean;
  setAcceptTerms: (accept: boolean) => void;
  onOpenTerms: () => void;
  bookingInProgress: boolean;
  onBookCabin: () => void;
  bookingErrors?: string[];
}

export const BookingSummary = ({
  cabin,
  locationData,
  selectedTurns,
  subtotalTurns,
  serviceFee,
  total,
  acceptTerms,
  setAcceptTerms,
  onOpenTerms,
  bookingInProgress,
  onBookCabin,
  bookingErrors = []
}: BookingSummaryProps) => {
  // Debug log when cabin or important props change
  useEffect(() => {
    debugBooking("BookingSummary rendered with cabin:", cabin?.id);
    debugBooking("BookingSummary location:", locationData?.id);
    debugBooking("BookingSummary selected turns:", selectedTurns);
  }, [cabin, locationData, selectedTurns]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {cabin && (
        <div className="flex flex-col space-y-2">
          <span className="font-medium">{cabin.name}</span>
          {locationData && <span>{locationData.name}</span>}
          {cabin.id && <span className="text-xs text-gray-500">ID: {cabin.id}</span>}
        </div>
      )}
      
      <div className="space-y-4 md:col-span-2">
        {bookingErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Atenção</h4>
                <ul className="text-sm text-amber-700 mt-1 list-disc pl-5">
                  {bookingErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="font-medium mb-2">Turnos selecionados:</h3>
          {Object.keys(selectedTurns).length > 0 ? (
            Object.entries(selectedTurns).map(([date, turns]) => (
              <div key={date} className="mb-2">
                <p className="text-sm text-gray-600">{date}:</p>
                <div className="flex flex-wrap gap-2">
                  {turns.map(turn => (
                    <span key={turn} className="text-sm bg-secondary px-2 py-1 rounded">
                      {turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum turno selecionado</p>
          )}
        </div>
        
        <Separator />
        
        {cabin && cabin.equipment && cabin.equipment.length > 0 && (
          <>
            <div>
              <h3 className="font-medium mb-2">O que está incluso:</h3>
              <ul className="grid gap-1 text-sm">
                {cabin.equipment.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Valor total dos turnos</span>
            <span>R$ {subtotalTurns.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxa de serviço (10%)</span>
            <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input 
            type="checkbox" 
            id="terms" 
            className="h-4 w-4" 
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <label htmlFor="terms" className="text-sm">
            Li e aceito os{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={onOpenTerms}
            >
              termos de uso
            </button>
          </label>
        </div>

        <Button 
          className="w-full mt-4" 
          onClick={() => {
            debugBooking("Reserve Space button clicked");
            onBookCabin();
          }}
          disabled={!acceptTerms || Object.keys(selectedTurns).length === 0 || bookingInProgress}
        >
          {bookingInProgress ? "Processando..." : "Reservar Espaço"}
        </Button>
      </div>
    </div>
  );
};
