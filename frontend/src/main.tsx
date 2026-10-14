
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { configureApi } from "@job-tracker/shared";

import App from "./App.tsx";
import "./index.css";

// Use the local backend during development and the same origin in production.
// VITE_API_URL can override the default for other environments.
const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:5270" : "");

configureApi(apiBaseUrl);

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);
