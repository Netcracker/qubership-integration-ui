import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App";

import "./index.css";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {EventPooling} from "./components/EventPooling.tsx";
import {EventProvider} from "./contexts/deployment/EventContext.tsx";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 0,
            retry: 0
        },
    },
});

createRoot(document.getElementById("root") as HTMLElement).render(
    <QueryClientProvider client={queryClient}>
        <EventProvider>
            <EventPooling/>
            <StrictMode>
                <App/>
            </StrictMode>
        </EventProvider>
    </QueryClientProvider>
);