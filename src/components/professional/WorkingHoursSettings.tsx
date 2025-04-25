
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkingHours, WorkingHours, BreakTime } from '@/hooks/useWorkingHours';
import { useAuth } from '@/lib/auth';

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const WorkingHoursSettings = () => {
  const { user } = useAuth();
  const { workingHours, breakTime, updateWorkingHours } = useWorkingHours(user?.id);

  const days = [
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const handleDayToggle = (day: string) => {
    if (!workingHours) return;

    const updatedHours: WorkingHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        enabled: !workingHours[day].enabled
      }
    };

    updateWorkingHours.mutate({ workingHours: updatedHours, breakTime: breakTime! });
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    if (!workingHours) return;

    const updatedHours: WorkingHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [type]: value
      }
    };

    updateWorkingHours.mutate({ workingHours: updatedHours, breakTime: breakTime! });
  };

  const handleBreakTimeChange = (type: 'start' | 'end', value: string) => {
    if (!breakTime) return;

    const updatedBreakTime: BreakTime = {
      ...breakTime,
      [type]: value
    };

    updateWorkingHours.mutate({ workingHours: workingHours!, breakTime: updatedBreakTime });
  };

  const handleBreakTimeToggle = () => {
    if (!breakTime) return;

    const updatedBreakTime: BreakTime = {
      ...breakTime,
      enabled: !breakTime.enabled
    };

    updateWorkingHours.mutate({ workingHours: workingHours!, breakTime: updatedBreakTime });
  };

  if (!workingHours || !breakTime) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de Trabalho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {days.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-4">
              <div className="w-32 flex items-center space-x-2">
                <Switch
                  checked={workingHours[key].enabled}
                  onCheckedChange={() => handleDayToggle(key)}
                />
                <Label>{label}</Label>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Select
                  value={workingHours[key].start}
                  onValueChange={(value) => handleTimeChange(key, 'start', value)}
                  disabled={!workingHours[key].enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Início" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={workingHours[key].end}
                  onValueChange={(value) => handleTimeChange(key, 'end', value)}
                  disabled={!workingHours[key].enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fim" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              checked={breakTime.enabled}
              onCheckedChange={handleBreakTimeToggle}
            />
            <Label>Horário de Intervalo</Label>
          </div>
          {breakTime.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={breakTime.start}
                onValueChange={(value) => handleBreakTimeChange('start', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={breakTime.end}
                onValueChange={(value) => handleBreakTimeChange('end', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkingHoursSettings;
