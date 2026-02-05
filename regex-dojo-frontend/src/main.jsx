import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

datadogRum.init({
  applicationId: import.meta.env.VITE_DATADOG_APP_ID,
  clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: import.meta.env.VITE_DATADOG_SERVICE,
  env: 'prod',
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  defaultPrivacyLevel: 'allow',
  plugins: [reactPlugin({ router: false })],
});


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
