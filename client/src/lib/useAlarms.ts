import { useQuery, useMutation } from "@tanstack/react-query";
import { type Alarm, type InsertAlarm } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

export function useAlarms() {
  const { data: alarms = [], isLoading } = useQuery<Alarm[]>({
    queryKey: ["/api/alarms"],
  });

  const createAlarm = useMutation({
    mutationFn: async (alarm: InsertAlarm) => {
      const res = await apiRequest("POST", "/api/alarms", alarm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
    },
  });

  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertAlarm> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/alarms/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
    },
  });

  const deleteAlarm = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alarms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
    },
  });

  return {
    alarms,
    isLoading,
    createAlarm,
    updateAlarm,
    deleteAlarm,
  };
}
