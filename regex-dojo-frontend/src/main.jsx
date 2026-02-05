import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

datadogRum.init({
  applicationId: '9669d947-ee8c-4389-a5e3-1f5479317660',
  clientToken: 'pub59c398c37bd7924bb3251b51b7478af4',
  site: 'datadoghq.com',
  service: 'regex-dojo',
  env: 'prod',
  version: '1.0.0',
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
