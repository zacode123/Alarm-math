import { useQuery, useMutation } from "@tanstack/react-query";
import { type Alarm, type InsertAlarm } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAlarms() {
  const { toast } = useToast();

  const { data: alarms = [], isLoading, error } = useQuery<Alarm[]>({
    queryKey: ["/api/alarms"],
    onError: (err) => {
      toast({
        title: "Error fetching alarms",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const createAlarm = useMutation({
    mutationFn: async (alarm: InsertAlarm) => {
      const res = await apiRequest("POST", "/api/alarms", alarm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      toast({
        title: "Alarm created",
        description: "Your new alarm has been set successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to create alarm",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertAlarm> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/alarms/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      toast({
        title: "Alarm updated",
        description: "Your alarm has been updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update alarm",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteAlarm = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alarms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      toast({
        title: "Alarm deleted",
        description: "Your alarm has been deleted successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete alarm",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return {
    alarms,
    isLoading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
  };
}