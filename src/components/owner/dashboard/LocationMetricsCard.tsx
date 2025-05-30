
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Cabin } from "@/lib/types";
import { memo } from "react";

interface LocationMetricsCardProps {
  cabinsCount: number;
}

export const LocationMetricsCard = memo(({ cabinsCount }: LocationMetricsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-soft-blue/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-soft-blue p-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">R$ 0</p>
              <p className="text-xs text-muted-foreground text-center">Receita (Mês)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-soft-green/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-soft-green p-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">R$ 0</p>
              <p className="text-xs text-muted-foreground text-center">Receita (Semana)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-soft-purple/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-soft-purple p-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground text-center">Reservas Hoje</p>
            </CardContent>
          </Card>
          
          <Card className="bg-soft-orange/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-soft-orange p-2 mb-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{cabinsCount}</p>
              <p className="text-xs text-muted-foreground text-center">Cabines</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
});

LocationMetricsCard.displayName = "LocationMetricsCard";
