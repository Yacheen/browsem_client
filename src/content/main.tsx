import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import { StrictMode } from 'react';
import { createPortal } from 'react-dom';
import Frame from 'react-frame-component';
import { isOverflown } from '@/utils/functions.ts';

const container = document.createElement('div');
container.id = "browsem-root";
Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100vh',
    zIndex: '6942013373',
    pointerEvents: 'none',
    // paddingRight: isOverflown(document.body) ? 16 : undefined,
});

document.body.appendChild(container);

createRoot(container).render(
    <StrictMode>
        <App  />
    </StrictMode>,
)
