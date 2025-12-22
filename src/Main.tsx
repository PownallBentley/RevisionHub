// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

import "./index.css";
// src/pages/Main.tsx

import Landing from "./Landing";

export default function Main() {
  return <Landing />;
}


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
