import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

datadogRum.init({
  applicationId: import.meta.env.VITE_DD_APPLICATION_ID,
  clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: import.meta.env.VITE_DD_SERVICE || 'react-vercel',
  env: import.meta.env.VITE_DD_ENV || 'production',
  version: import.meta.env.VITE_DD_VERSION,

  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  defaultPrivacyLevel: 'allow',
  plugins: [reactPlugin({ router: true })],
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
