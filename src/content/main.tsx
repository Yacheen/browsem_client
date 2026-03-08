import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { initPegasusTransport } from '@webext-pegasus/transport/content-script';
import { StrictMode } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { browsemStoreReady } from '@/hooks/browsemStore.tsx';
import { channelsStoreReady } from '@/hooks/ChannelsStore.tsx';
import { settingsStoreReady } from '@/hooks/settingsStore.tsx';
import { snackbarStoreReady } from '@/hooks/snackbarStore.tsx';

try {
    initPegasusTransport({
        allowWindowMessagingForNamespace: "694201337"
    });
} catch(err) {
    console.error('initPegasusTransport THREW:', err);
}
Promise.all([
    browsemStoreReady(),
    channelsStoreReady(),
    settingsStoreReady(),
    snackbarStoreReady(),
    
]).then(() => {

    const mount = () => {
        const existingHost = document.getElementById('browsem-host');
        if (existingHost) existingHost.remove();

        const host = document.createElement('div');
        host.id = "browsem-host";
        document.body.appendChild(host);

        const shadowRoot = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        container.id = "browsem-root";
        Object.assign(container.style, {
            position: 'fixed',
            inset: '0',
            width: '100%',
            height: '100vh',
            zIndex: '6942013373',
            pointerEvents: 'none',
        });
        shadowRoot.appendChild(container);

        const muiCache = createCache({
            key: 'browsem-mui',
            container: shadowRoot,
        });

        createRoot(container).render(
            <CacheProvider value={muiCache}>
                <App />
            </CacheProvider>
        );
    };

    if (document.body) {
        mount();
    } else {
        document.addEventListener('DOMContentLoaded', mount);
    }
}).catch(err => {
    console.error('failed:', err);
});
