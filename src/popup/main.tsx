import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPegasusTransport } from '@webext-pegasus/transport/popup'
import { channelsStoreReady } from '@/hooks/ChannelsStore.tsx'
import { browsemStoreReady } from '@/hooks/browsemStore.tsx'
import { settingsStoreReady } from '@/hooks/settingsStore.tsx'
import { snackbarStoreReady } from '@/hooks/snackbarStore.tsx'
import { volumeStoreReady } from '@/hooks/volumeStore.tsx'

initPegasusTransport();

Promise.all([
    browsemStoreReady(),
    channelsStoreReady(),
    settingsStoreReady(),
    snackbarStoreReady(),
    volumeStoreReady(),
]).then(() => {
    createRoot(document.getElementById('root')!).render(
            <App />
    )
});
