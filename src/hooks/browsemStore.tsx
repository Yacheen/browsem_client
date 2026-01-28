import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChromeLocalStorage, ChromeSessionStorage } from 'zustand-chrome-storage';

type SocketState = 'Connected' | 'Disconnected' | 'Connecting'

interface BrowsemStoreState {
    socketState: SocketState,
    disconnect: () => void,
    disconnected: () => void,
    
    connect: () => void,
    connected: () => void,
}

export const useBrowsemStore = create<BrowsemStoreState>()(
    persist(
        (set, get) => ({
            socketState: 'Disconnected',
            connect: () => {
                chrome.runtime.sendMessage({
                    "type": "connect"
                });
                set({ socketState: 'Connecting' });
            },
            disconnect: () => {
                chrome.runtime.sendMessage({
                    "type": "disconnect"
                });
                set({ socketState: 'Disconnected' });
            },
            connected: () => {
                let state = get().socketState;
                if (state !== 'Connected') {
                    set({ socketState: 'Connected' });
                }
            },
            disconnected: () => {
                let state = get().socketState;
                if (state !== 'Disconnected') {
                    set({ socketState: 'Disconnected' });
                }
            }
        }),
        {
            name: "state-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
