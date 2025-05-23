import { api } from "../api/api.ts";
import { Chain } from "../api/apiTypes.ts";
import { useEffect, useState } from "react";
import { useNotificationService } from "./useNotificationService.tsx";

export const useChain = (chainId?: string) => {
  const [chain, setChain] = useState<Chain>();
  const notificationService = useNotificationService();

  useEffect(() => {
    if (!chainId) return;
    getChain(chainId);
  }, []);

  const updateChain = async (chainId: string, chain: Partial<Chain>) => {
    try {
      await api.updateChain(chainId, chain);
    } catch (error) {
      notificationService.errorWithDetails("Failed to create snapshot", error);
    }
  };

  const getChain = async (chainId: string) => {
    try {
      const data = await api.getChain(chainId);
      setChain(data);
    } catch (error) {
      notificationService.errorWithDetails("Failed to load snapshots", error);
    }
  };

  return { chain, updateChain };
};
