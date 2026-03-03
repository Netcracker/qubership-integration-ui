import React, { useContext, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

export type FitViewToElementIdFn = (id: string) => void;

export const FitViewBridgeContext = React.createContext<React.MutableRefObject<FitViewToElementIdFn | null> | null>(null);

export const useFitViewBridgeRef = () => {
    const ref = useContext(FitViewBridgeContext);
    if (!ref) {
        throw new Error("useFitViewBridgeRef must be used within FitViewBridgeContextProvider");
    }
    return ref;
};

export const useFitViewToElementId = (): FitViewToElementIdFn => {
    const ref = useFitViewBridgeRef();
    return (id: string) => ref.current?.(id);
};

export const FitViewBridge = () => {
    const ref = useFitViewBridgeRef();
    const { fitView, getNodes } = useReactFlow();

    useEffect(() => {
        ref.current = (id: string) => {
            const nodes = getNodes();
            if (!nodes.some((n) => n.id === id)) return;
            fitView({
                nodes: [{ id }],
                padding: 0.2,
                duration: 300,
            });
        };
        return () => {
            ref.current = null;
        };
    }, [ref, fitView, getNodes]);

    return null;
};
