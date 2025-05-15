import {api} from "../api/api.ts";
import {useQuery} from "@tanstack/react-query";
import {notification} from "antd";
import {Event} from "../api/apiTypes.ts";
import React, {useEffect, useState} from "react";


export const EventPooling: React.FC = () => {
    const REFRESH_TIME_MS = 3 * 1000;
    const ON_ERR_TIME_MS = 8 * 1000;

    const [refetchInterval, setRefetchInterval] = useState(3000);
    const [lastEventId, setLastEventId] = useState<string | null>(null);

    const fetchEvents = async () => {
        const lastEventIdRequestParam = lastEventId ? lastEventId : "";
        return await api.getEvents(lastEventIdRequestParam);
    }

    const {data, error } = useQuery({
        queryKey: ["events"],
        queryFn: fetchEvents,
        refetchInterval,
        refetchOnWindowFocus: false,
        enabled: true,
    });

    useEffect(() => {

        if (error) {
            setRefetchInterval(refetchInterval !== ON_ERR_TIME_MS ? ON_ERR_TIME_MS : refetchInterval);
            return;
        }

        if (data && data?.events.length > 0) {
            setRefetchInterval(refetchInterval !== REFRESH_TIME_MS ? REFRESH_TIME_MS : refetchInterval);

            //TODO General Notification Approach
            data?.events.forEach((event: Event) => {
                notification.open({
                    message: "Новое событие",
                    description: `${event.id}`
                });
            });

            setLastEventId(data?.lastEventId);
        }

    }, [data, error, refetchInterval]);

    return null;
};

