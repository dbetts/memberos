import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./application";
import "./../css/app.css";  // Import Tailwind/styles

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter basename="/app">
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
