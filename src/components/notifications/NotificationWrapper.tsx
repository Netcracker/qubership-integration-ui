import {notification} from "antd";
import {useNotificationLog} from "./contexts/NotificationLogContext.tsx";
import React, {useEffect, useRef} from "react";
import {ArgsProps} from "antd/es/notification";


export const NotificationWrapper: React.FC = () => {
    const { addToHistory } = useNotificationLog();
    const addToHistoryRef  = useRef(addToHistory)

    useEffect(() => {
        addToHistoryRef.current = addToHistory;
    });

    useEffect(() => {
       const originalOpen = notification.open;

       notification.open = (config: ArgsProps) => {
           originalOpen(config);
           addToHistoryRef.current(config);
       }

       return () => {
           notification.open = originalOpen;
       };

    }, []);

    return null;
}