
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { debugAreaLog } from "@/utils/debugLogger";

type BatchPriceEditorProps = {
  onPriceChange: (dates: string[], turns: string[], price: number) => void;
  defaultPrice?: number;
};

export const BatchPriceEditor: React.FC<BatchPriceEditorProps> = ({
  onPriceChange,
  defaultPrice = 100
}) => {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [selectedTab, setSelectedTab] = React.useState<string>("dateRange");
  const [price, setPrice] = React.useState<string>(defaultPrice.toString());
  
  // Time slots selection
  const [morningSelected, setMorningSelected] = React.useState<boolean>(true);
  const [afternoonSelected, setAfternoonSelected] = React.useState<boolean>(true);
  const [eveningSelected, setEveningSelected] = React.useState<boolean>(true);

  // Weekday specific settings
  const weekdays = [
    { id: "mon", label: "Segunda", selected: false },
    { id: "tue", label: "Terça", selected: false },
    { id: "wed", label: "Quarta", selected: false },
    { id: "thu", label: "Quinta", selected: false },
    { id: "fri", label: "Sexta", selected: false },
    { id: "sat", label: "Sábado", selected: false },
    { id: "sun", label: "Domingo", selected: false },
  ];
  
  const [selectedWeekdays, setSelectedWeekdays] = React.useState(weekdays);

  // Handle weekday selection
  const handleWeekdayChange = (id: string) => {
    setSelectedWeekdays(prev => 
      prev.map(day => day.id === id ? {...day, selected: !day.selected} : day)
    );
  };

  // Get all dates in a month
  const getDatesInMonth = (year: number, month: number) => {
    const dates: Date[] = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Handle month selection
  const handleSelectMonth = () => {
    if (selectedDates.length > 0) {
      const firstDate = selectedDates[0];
      const year = firstDate.getFullYear();
      const month = firstDate.getMonth();
      
      const datesInMonth = getDatesInMonth(year, month);
      setSelectedDates(datesInMonth);
      
      toast({
        title: "Mês selecionado",
        description: `Selecionou todos os dias de ${format(firstDate, "MMMM yyyy", { locale: ptBR })}`
      });
    } else {
      toast({
        title: "Selecione uma data primeiro",
        description: "Selecione pelo menos uma data para selecionar o mês inteiro",
        variant: "destructive"
      });
    }
  };

  // Apply price changes
  const handleApplyPriceChanges = () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor, insira um preço válido maior que zero",
        variant: "destructive"
      });
      return;
    }

    if (selectedTab === "dateRange" && selectedDates.length === 0) {
      toast({
        title: "Nenhuma data selecionada",
        description: "Por favor, selecione pelo menos uma data",
        variant: "destructive"
      });
      return;
    }

    if (selectedTab === "weekdays" && !selectedWeekdays.some(day => day.selected)) {
      toast({
        title: "Nenhum dia da semana selecionado",
        description: "Por favor, selecione pelo menos um dia da semana",
        variant: "destructive"
      });
      return;
    }

    const selectedTurns: string[] = [];
    if (morningSelected) selectedTurns.push("morning");
    if (afternoonSelected) selectedTurns.push("afternoon");
    if (eveningSelected) selectedTurns.push("evening");

    if (selectedTurns.length === 0) {
      toast({
        title: "Nenhum turno selecionado",
        description: "Por favor, selecione pelo menos um turno",
        variant: "destructive"
      });
      return;
    }

    // For specific dates
    if (selectedTab === "dateRange") {
      const formattedDates = selectedDates.map(date => format(date, "yyyy-MM-dd"));
      debugAreaLog('PRICE_EDIT', 'Batch applying price to dates:', { 
        dates: formattedDates, 
        turns: selectedTurns, 
        price: numericPrice 
      });
      
      onPriceChange(formattedDates, selectedTurns, numericPrice);
      
      toast({
        title: "Preços atualizados",
        description: `Preço atualizado para R$ ${numericPrice} em ${formattedDates.length} data(s)`
      });
    } 
    // For weekdays
    else if (selectedTab === "weekdays") {
      const selectedDays = selectedWeekdays
        .filter(day => day.selected)
        .map(day => day.id);
        
      if (selectedDays.length > 0) {
        // Get current month's dates that match the selected weekdays
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        const allMonthDates = getDatesInMonth(year, month);
        
        // Filter dates by selected weekdays
        const weekdayMap: Record<string, number> = {
          'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
        };
        
        const matchingDates = allMonthDates.filter(date => {
          const dayOfWeek = date.getDay();
          return selectedDays.some(day => weekdayMap[day] === dayOfWeek);
        });
        
        const formattedDates = matchingDates.map(date => format(date, "yyyy-MM-dd"));
        
        debugAreaLog('PRICE_EDIT', 'Batch applying price to weekdays:', { 
          weekdays: selectedDays, 
          dates: formattedDates, 
          turns: selectedTurns, 
          price: numericPrice 
        });
        
        onPriceChange(formattedDates, selectedTurns, numericPrice);
        
        toast({
          title: "Preços atualizados",
          description: `Preço atualizado para R$ ${numericPrice} em ${formattedDates.length} data(s)`
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edição de Preços em Massa</CardTitle>
        <CardDescription>Configure preços para múltiplos dias e turnos</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dateRange">Datas Específicas</TabsTrigger>
            <TabsTrigger value="weekdays">Dias da Semana</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dateRange" className="space-y-4">
            <div className="my-4">
              <Button onClick={handleSelectMonth} variant="outline" className="w-full">
                Selecionar Mês Inteiro
              </Button>
            </div>
            
            <div className="border rounded-md p-2">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates as any}
                className="pointer-events-auto"
                locale={ptBR}
              />
            </div>
            
            {selectedDates.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {selectedDates.length} dia(s) selecionado(s)
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="weekdays" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {selectedWeekdays.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={day.id} 
                    checked={day.selected}
                    onCheckedChange={() => handleWeekdayChange(day.id)}
                  />
                  <Label htmlFor={day.id}>{day.label}</Label>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Digite o preço"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Turnos</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="morning" 
                  checked={morningSelected}
                  onCheckedChange={() => setMorningSelected(prev => !prev)}
                />
                <Label htmlFor="morning">Manhã</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="afternoon" 
                  checked={afternoonSelected}
                  onCheckedChange={() => setAfternoonSelected(prev => !prev)}
                />
                <Label htmlFor="afternoon">Tarde</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="evening" 
                  checked={eveningSelected}
                  onCheckedChange={() => setEveningSelected(prev => !prev)}
                />
                <Label htmlFor="evening">Noite</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleApplyPriceChanges}
        >
          Aplicar Alterações de Preço
        </Button>
      </CardFooter>
    </Card>
  );
};
