import { useQuery, useMutation } from "@tanstack/react-query";
import { type Alarm, type InsertAlarm } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAlarms() {
  const { toast } = useToast();

  const { data: alarms = [], isLoading, error } = useQuery<Alarm[]>({
    queryKey: ["/api/alarms"],
    retry: 3,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60, // 1 minute
    onError: (error: Error) => {
      toast({
        title: "Error fetching alarms",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAlarm = useMutation({
    mutationFn: async (alarm: InsertAlarm): Promise<Alarm> => {
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
    onError: (error: Error) => {
      toast({
        title: "Failed to create alarm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertAlarm> & { id: number }): Promise<Alarm> => {
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
    onError: (error: Error) => {
      toast({
        title: "Failed to update alarm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAlarm = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/alarms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alarms"] });
      toast({
        title: "Alarm deleted",
        description: "Your alarm has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete alarm",
        description: error.message,
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