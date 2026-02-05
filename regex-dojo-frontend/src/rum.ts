import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

export function initRum() {
    const clientToken = import.meta.env.VITE_DD_CLIENT_TOKEN;
    const applicationId = import.meta.env.VITE_DD_APPLICATION_ID;
    const site = import.meta.env.VITE_DD_SITE || 'datadoghq.com';

    if (!clientToken || !applicationId) return;

    datadogRum.init({
        applicationId,
        clientToken,
        site,
        service: import.meta.env.VITE_DD_SERVICE || 'react-vercel',
        env: import.meta.env.VITE_DD_ENV || 'production',
        version: import.meta.env.VITE_DD_VERSION,

        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        defaultPrivacyLevel: 'allow',
        plugins: [reactPlugin({ router: true })],
    });
}
