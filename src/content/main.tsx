import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { StrictMode } from 'react';

// 1. Create the host element that will contain the Shadow DOM
const host = document.createElement('div');
host.id = "browsem-host";
document.body.appendChild(host);

// 2. Attach a shadow root (mode: open allows JavaScript to access it)
const shadowRoot = host.attachShadow({ mode: 'open' });

// 3. Create a container inside the shadow DOM for React
const container = document.createElement('div');
container.id = "browsem-root";

// 4. Apply styles to the container to ensure it covers the area
Object.assign(container.style, {
  position: 'fixed',
  inset: '0',
  width: '100%',
  height: '100vh',
  zIndex: '6942013373',
  pointerEvents: 'none', // Allows clicking through if necessary
});

// 5. Append the container to the shadow root
shadowRoot.appendChild(container);

// 6. (Optional) Inject your CSS into the Shadow DOM
// Assuming you use Vite, import styles as a string
// import styles from './index.css?raw';
// const styleElement = document.createElement('style');
// styleElement.innerHTML = styles;
// shadowRoot.appendChild(styleElement);

// Create the Emotion cache targeting the shadow root
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
const muiCache = createCache({
  key: 'browsem-mui',
  container: shadowRoot, // This is the magic part
});
// 7. Render React into the shadow container
createRoot(container).render(
  <StrictMode>
    <CacheProvider value={muiCache}>
        <App />
    </CacheProvider>
  </StrictMode>,
)
