console.log('⤴ main.jsx loaded in browser');
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

datadogRum.init({
  applicationId: import.meta.env.VITE_DATADOG_APP_ID,
  clientToken: `pub59c398c37bd7924bb3251b51b7478af4`,
  site: 'datadoghq.com',
  service: import.meta.env.VITE_DATADOG_SERVICE,
  env: 'production',
  version: '1.0.0',

  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  defaultPrivacyLevel: 'allow',
  plugins: [reactPlugin({ router: true })],
});
// immediately after datadogRum.init(...)
window.__datadog_rum_debug = datadogRum;             // temporary — exposes the instance for console checks
console.log('datadogRum local var ->', !!datadogRum);
try { console.log('getInitConfiguration ->', datadogRum.getInitConfiguration?.()); } catch (e) { console.error(e); }
datadogRum.onReady?.(() => console.log('datadogRum.onReady -> READY'));
setTimeout(() => datadogRum.addAction?.('diagnostic-test-action'), 300);


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
