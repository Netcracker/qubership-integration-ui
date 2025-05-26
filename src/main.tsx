import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App";
import {EventNotification} from "./components/notifications/EventNotification.tsx";

import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
    <EventNotification>
            <StrictMode>
                <App/>
            </StrictMode>
    </EventNotification>
);