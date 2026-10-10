import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  configureApi
} from "@job-tracker/shared";

import App from "./App.tsx";
import "./index.css";


// Configure the shared API client once for the web application.
// Vite uses VITE_* environment variables.
configureApi(
  import.meta.env.VITE_API_URL
  ?? "http://localhost:5270"
);


createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);