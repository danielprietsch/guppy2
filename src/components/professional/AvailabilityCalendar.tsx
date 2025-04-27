import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DailyView from './calendar/DailyView';
import WeeklyView from './calendar/WeeklyView';

const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

  // Fetch user profile to get creation date
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
  });

  // Set initial selected date based on user creation date or default to today
  useEffect(() => {
    if (userProfile?.created_at) {
      setSelectedDate(new Date(userProfile.created_at));
    } else {
      setSelectedDate(new Date());
    }
  }, [userProfile]);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  if (!selectedDate) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardContent className="p-4 flex flex-col space-y-6">
        <div className="flex justify-center mb-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "weekly" | "daily")}>
            <ToggleGroupItem value="weekly">Semanal</ToggleGroupItem>
            <ToggleGroupItem value="daily">Diário</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-8">
          {viewMode === "weekly" ? (
            <Card>
              <CardContent className="p-0">
                <WeeklyView
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  createdAt={userProfile?.created_at}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <DailyView
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  createdAt={userProfile?.created_at}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
