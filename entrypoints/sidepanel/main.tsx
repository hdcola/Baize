import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@/assets/style.css";
import "../../src/lib/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
