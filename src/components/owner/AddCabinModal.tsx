
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { CalendarIcon, CalendarCheck, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Turno = "morning" | "afternoon" | "evening";

interface PrecoPorTurno {
  morning: number;
  afternoon: number;
  evening: number;
  availability?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface PrecosPorDia {
  [date: string]: PrecoPorTurno;
}

interface PrecosPorDiaSemana {
  0: PrecoPorTurno; // Domingo
  1: PrecoPorTurno; // Segunda
  2: PrecoPorTurno; // Terça
  3: PrecoPorTurno; // Quarta
  4: PrecoPorTurno; // Quinta
  5: PrecoPorTurno; // Sexta
  6: PrecoPorTurno; // Sábado
}

interface AddCabinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  onCabinCreated?: (cabin: Cabin) => void;
}

const TURNOS: { key: Turno; label: string }[] = [
  { key: "morning", label: "Manhã" },
  { key: "afternoon", label: "Tarde" },
  { key: "evening", label: "Noite" }
];

const DIAS_SEMANA = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

export const AddCabinModal: React.FC<AddCabinModalProps> = ({
  open,
  onOpenChange,
  locationId,
  onCabinCreated
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [equipment, setEquipment] = React.useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = React.useState("");
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState<PrecosPorDia>({});
  
  const [activeTab, setActiveTab] = React.useState<string>("individual");
  
  // Preços padrão por dia da semana
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState<PrecosPorDiaSemana>({
    0: { morning: 150, afternoon: 150, evening: 150 }, // Domingo
    1: { morning: 100, afternoon: 100, evening: 100 }, // Segunda
    2: { morning: 100, afternoon: 100, evening: 100 }, // Terça
    3: { morning: 100, afternoon: 100, evening: 100 }, // Quarta
    4: { morning: 100, afternoon: 100, evening: 100 }, // Quinta
    5: { morning: 100, afternoon: 100, evening: 100 }, // Sexta
    6: { morning: 150, afternoon: 150, evening: 150 }, // Sábado
  });
  
  // Valor rápido para dias úteis e finais de semana
  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
  
  // Turno input para preço individual
  const [turnoInputs, setTurnoInputs] = React.useState<{ [key in Turno]: string }>({
    morning: "", 
    afternoon: "", 
    evening: ""
  });
  
  // Disponibilidade para o dia selecionado
  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState<{ [key in Turno]: boolean }>({
    morning: true, 
    afternoon: true, 
    evening: true
  });

  // Função para adicionar equipamento à lista
  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    setEquipment([...equipment, equipmentInput.trim()]);
    setEquipmentInput("");
  };

  // Função para remover equipamento da lista
  const handleRemoveEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  // Função para adicionar preço para o dia selecionado
  const handleAddPriceByDay = () => {
    if (!selectedDate) {
      toast({ title: "Selecione uma data!", variant: "destructive" });
      return;
    }
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const novosPrecos = {...precosPorDia};
    
    // Verificar se há pelo menos um valor definido
    const hasValue = Object.values(turnoInputs).some(val => val.trim() !== "");
    
    if (!hasValue) {
      toast({ title: "Defina pelo menos um preço para algum turno!", variant: "destructive" });
      return;
    }

    // Se o dia não existe, criar novo objeto para o dia
    if (!novosPrecos[dateStr]) {
      novosPrecos[dateStr] = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        availability: {
          morning: turnoDisponibilidade.morning,
          afternoon: turnoDisponibilidade.afternoon,
          evening: turnoDisponibilidade.evening
        }
      };
    }

    // Atualizar preços para cada turno se valor foi fornecido
    TURNOS.forEach(turno => {
      const valor = parseFloat(turnoInputs[turno.key]);
      if (!isNaN(valor) && valor > 0) {
        novosPrecos[dateStr][turno.key] = valor;
      }
      
      // Sempre atualize disponibilidade
      if (novosPrecos[dateStr].availability) {
        novosPrecos[dateStr].availability![turno.key] = turnoDisponibilidade[turno.key];
      }
    });

    setPrecosPorDia(novosPrecos);
    
    // Limpar campos
    setSelectedDate(undefined);
    setTurnoInputs({morning: "", afternoon: "", evening: ""});
    setTurnoDisponibilidade({morning: true, afternoon: true, evening: true});
    
    toast({ title: "Preços definidos!", description: `Preços atualizados para ${format(selectedDate, "dd/MM/yyyy")}` });
  };

  // Função para atualizar inputs de turno
  const handleTurnoInputChange = (turno: Turno, value: string) => {
    setTurnoInputs({
      ...turnoInputs,
      [turno]: value.replace(/[^\d.]/g, "")
    });
  };

  // Função para atualizar disponibilidade dos turnos
  const handleTurnoDisponibilidadeChange = (turno: Turno, checked: boolean) => {
    setTurnoDisponibilidade({
      ...turnoDisponibilidade,
      [turno]: checked
    });
  };

  // Função para aplicar os valores padrão para dias úteis e fim de semana
  const handleApplyDefaultPrices = () => {
    const valorUteis = parseFloat(valorDiasUteis);
    const valorFimSemana = parseFloat(valorFimSemana);
    
    if (isNaN(valorUteis) || isNaN(valorFimSemana)) {
      toast({ title: "Valores inválidos", description: "Verifique os valores informados", variant: "destructive" });
      return;
    }
    
    const novosPrecos = { ...precosPorDiaSemana };
    
    // Dias úteis (Segunda a Sexta: 1-5)
    for (let i = 1; i <= 5; i++) {
      novosPrecos[i as keyof PrecosPorDiaSemana] = {
        morning: valorUteis,
        afternoon: valorUteis,
        evening: valorUteis
      };
    }
    
    // Fim de semana (Sábado e Domingo: 6, 0)
    novosPrecos[0] = { morning: valorFimSemana, afternoon: valorFimSemana, evening: valorFimSemana };
    novosPrecos[6] = { morning: valorFimSemana, afternoon: valorFimSemana, evening: valorFimSemana };
    
    setPrecosPorDiaSemana(novosPrecos);
    toast({ title: "Preços padrão definidos", description: "Os preços padrão foram atualizados" });
  };

  // Função para extrair preços do calendario para a cabine
  const getPricesFromCalendar = () => {
    // Se não houver preços específicos por dia, usar os padrões por dia da semana
    if (Object.keys(precosPorDia).length === 0) {
      return {
        defaultPricing: precosPorDiaSemana,
        specificDates: {}
      };
    }
    
    return {
      defaultPricing: precosPorDiaSemana,
      specificDates: precosPorDia
    };
  };

  // Função para criar a cabine
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    // Criar nova cabine
    const novaCabine: Cabin = {
      id: Math.random().toString(36).slice(2),
      locationId,
      name,
      description,
      equipment,
      imageUrl: "",
      availability: {
        morning: true,
        afternoon: true,
        evening: true
      },
      price: 100, // Preço base
      pricing: getPricesFromCalendar()
    };
    
    onCabinCreated?.(novaCabine);
    toast({ title: "Cabine adicionada com sucesso!" });
    onOpenChange(false);
    
    // Limpar formulário
    setName("");
    setDescription("");
    setEquipment([]);
    setPrecosPorDia({});
    setSelectedDate(undefined);
  };

  // Renderizar lista de preços adicionados por data específica
  const renderPrecos = () => {
    if (Object.keys(precosPorDia).length === 0) {
      return <span className="text-muted-foreground text-xs">Nenhum preço específico definido</span>;
    }
    
    return Object.entries(precosPorDia).map(([date, turnos]) => (
      <div key={date} className="mb-2 border-b pb-2">
        <span className="font-semibold">{format(new Date(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</span>
        <div className="flex flex-wrap gap-2 ml-2 mt-1 mb-1">
          {TURNOS.map(turno => {
            const disponivel = turnos.availability?.[turno.key] !== false;
            return (
              <span 
                key={turno.key} 
                className={`px-2 py-0.5 rounded text-xs ${
                  disponivel 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {turno.label}: {disponivel ? `R$ ${turnos[turno.key].toFixed(2)}` : 'Indisponível'}
              </span>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Cabine</DialogTitle>
          <DialogDescription>
            Cadastre uma nova cabine e defina seus preços por turno para diferentes dias da semana ou datas específicas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome da Cabine</Label>
              <Input 
                id="name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nome da cabine" 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Descrição da cabine" 
                rows={3} 
              />
            </div>
            
            <div>
              <Label>Equipamentos</Label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={equipmentInput} 
                  onChange={(e) => setEquipmentInput(e.target.value)} 
                  placeholder="Adicionar equipamento" 
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddEquipment}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {equipment.map((item, index) => (
                  <span 
                    key={index} 
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center"
                  >
                    {item}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1 text-red-500" 
                      onClick={() => handleRemoveEquipment(index)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
                {equipment.length === 0 && (
                  <span className="text-muted-foreground text-sm">Nenhum equipamento adicionado</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Configuração de Preços</h3>
            
            <Tabs defaultValue="padrao" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="padrao">Preços Padrão</TabsTrigger>
                <TabsTrigger value="individual">Datas Específicas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="padrao" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Dias úteis (Segunda a Sexta)</Label>
                          <div className="flex items-center mt-1">
                            <span className="mr-2">R$</span>
                            <Input 
                              value={valorDiasUteis} 
                              onChange={(e) => setValorDiasUteis(e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-24" 
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Finais de semana (Sábado e Domingo)</Label>
                          <div className="flex items-center mt-1">
                            <span className="mr-2">R$</span>
                            <Input 
                              value={valorFimSemana} 
                              onChange={(e) => setValorFimSemana(e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-24" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={handleApplyDefaultPrices} 
                        className="w-full"
                      >
                        Aplicar Preços Padrão
                      </Button>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Preços por dia da semana:</h4>
                        <div className="space-y-2">
                          {DIAS_SEMANA.map((dia, index) => (
                            <div key={index} className="flex justify-between items-center py-1 border-b">
                              <span className="font-medium">{dia}</span>
                              <div className="flex gap-2">
                                {TURNOS.map(turno => (
                                  <div key={turno.key} className="text-xs flex items-center">
                                    <span className="mr-1">{turno.label}:</span>
                                    <span className="font-medium">
                                      R$ {precosPorDiaSemana[index as keyof PrecosPorDiaSemana][turno.key].toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="individual" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/2">
                        <Label className="mb-2 block">Selecionar data</Label>
                        <div className="mb-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                locale={ptBR}
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          {TURNOS.map(turno => (
                            <div key={turno.key} className="flex flex-col space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm">{turno.label}</Label>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={turnoDisponibilidade[turno.key]}
                                    onCheckedChange={(checked) => 
                                      handleTurnoDisponibilidadeChange(turno.key, checked)
                                    }
                                    disabled={!selectedDate}
                                  />
                                  <span className="text-xs">
                                    {turnoDisponibilidade[turno.key] ? "Disponível" : "Indisponível"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <span className="mr-2">R$</span>
                                <Input
                                  type="text"
                                  placeholder="0.00"
                                  value={turnoInputs[turno.key]}
                                  onChange={(e) => handleTurnoInputChange(turno.key, e.target.value)}
                                  className="w-24"
                                  disabled={!selectedDate || !turnoDisponibilidade[turno.key]}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddPriceByDay}
                          disabled={!selectedDate}
                          className="w-full mt-4"
                        >
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          Definir Preço/Disponibilidade
                        </Button>
                      </div>

                      <div className="md:w-1/2">
                        <div className="border rounded-md p-4 h-[320px] overflow-y-auto">
                          <h4 className="font-medium mb-2 flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Preços e disponibilidade
                          </h4>
                          <div className="space-y-1">
                            {renderPrecos()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary">
              Adicionar Cabine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
