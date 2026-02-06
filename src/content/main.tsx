import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { StrictMode } from 'react';

const container = document.createElement('div');
container.id = "browsem-root-container";
Object.assign(container.style, {
    all: 'initial',
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '6942013373',
    pointerEvents: 'none',
});

document.body.appendChild(container);

// Pass 'shadow' as a prop to App
createRoot(container).render(
    <StrictMode>
        <App  />
    </StrictMode>
);
