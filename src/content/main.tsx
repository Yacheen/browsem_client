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
console.log('CONTENT SCRIPT EXECUTING', window.location.href);
console.log('__browsemTransportInit:', (window as any).__browsemTransportInit);

console.log('CALLING initPegasusTransport');
try {
    initPegasusTransport({
        allowWindowMessagingForNamespace: "694201337"
    });
    console.log('initPegasusTransport DONE');
} catch(err) {
    console.error('initPegasusTransport THREW:', err);
}
console.log('CALLING Promise.all');
Promise.all([
    browsemStoreReady(),
    channelsStoreReady(),
    settingsStoreReady(),
    snackbarStoreReady(),
    
]).then(() => {
    console.log('6. all stores ready, mounting React');
    console.log('document.body:', document.body);
    console.log('document.readyState:', document.readyState);

    const mount = () => {
        const existingHost = document.getElementById('browsem-host');
        if (existingHost) existingHost.remove();

        const host = document.createElement('div');
        host.id = "browsem-host";
        document.body.appendChild(host);
        console.log('7. host appended:', host);

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
        console.log('8. React mounted');
    };

    if (document.body) {
        mount();
    } else {
        console.log('body not ready, waiting...');
        document.addEventListener('DOMContentLoaded', mount);
    }
}).catch(err => {
    console.error('failed:', err);
});
