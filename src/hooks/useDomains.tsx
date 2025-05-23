import { api } from "../api/api.ts";
import { EngineDomain } from "../api/apiTypes.ts";
import { useEffect, useState } from "react";
import { useNotificationService } from "./useNotificationService.tsx";

export const useDomains = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState<EngineDomain[]>();
  const notificationService = useNotificationService();

  useEffect(() => {
    getDomains();
  }, []);

  const getDomains = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDomains();
      setDomains(data);
    } catch (error) {
      notificationService.errorWithDetails("Failed to load domains", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, domains };
};
