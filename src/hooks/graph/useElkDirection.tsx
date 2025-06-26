import { useCallback, useState } from "react";

export type ElkDirection = "RIGHT" | "DOWN";

export const useElkDirection = () => {
  const [elkDirection, setElkDirection] = useState<ElkDirection>("RIGHT");

  const toggleDirection = useCallback(() => {
    setElkDirection((direction) => (direction === "RIGHT" ? "DOWN" : "RIGHT"));
  }, []);

  return { elkDirection, toggleDirection };
};
