import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChromeLocalStorage, ChromeSessionStorage } from 'zustand-chrome-storage';
import { BackgroundMessage, Connected, Disconnected } from '@/popup/App';

type SocketState = 'Connected' | 'Disconnected' | 'Connecting';
export type CurrentSelection = 'Intro' | 'CreatingGuestUsername' | 'Connected' | 'CreatingChannel';
type BrowsemErrors = {
    noChannelName: string | null,
    channelNameTooLong: string | null,
    channelNameExists: string | null,
};

interface BrowsemStoreState {
    socketState: SocketState,
    currentSelection: CurrentSelection,
    sessionId: string | null,
    username: string,
    errors: BrowsemErrors,
    onlineSessions: number,
    onlineInYourLocation: number,
    onlineInYourUrl: number,
    currentUrl: string,
    urlsOpened: string[],
    urlOriginsOpened: string[],

    disconnect: () => void,
    disconnected: (message: Disconnected) => void,
    connect: () => void,
    connected: (message: Connected) => void,
    setUsername: (username: string) => void,
    setCurrentSelection: (currentSelection: CurrentSelection) => void,
    setCurrentUrl: (currentUrl: string) => void,
    setErrors: (errors: BrowsemErrors) => void,
    setUrlsOpened: (urlsOpened: string[]) => void,
    setUrlOriginsOpened: (urlOriginsOpened: string[]) => void,
}

export const useBrowsemStore = create<BrowsemStoreState>()(
    persist(
        (set, get) => ({
            socketState: 'Disconnected',
            currentSelection: 'Intro',
            sessionId: null,
            username: "",
            errors: {
                noChannelName: null,
                channelNameTooLong: null,
                channelNameExists: null
            },
            onlineSessions: 0,
            onlineInYourLocation: 0,
            onlineInYourUrl: 0,
            currentUrl: "",
            urlsOpened: [],
            urlOriginsOpened: [],

            setUsername: (username: string) => {
                set({ username });
            },
            setCurrentSelection: (currentSelection: CurrentSelection) => {
                set({ currentSelection })
            },
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
            connected: (message: Connected) => {
                let state = get().socketState;
                if (state !== 'Connected') {
                    set({ socketState: 'Connected', onlineSessions: message.Connected.onlineSessions, sessionId: message.Connected.sessionId });
                }
            },
            disconnected: (message: Disconnected) => {
                let state = get().socketState;
                if (state !== 'Disconnected') {
                    if (message.Disconnected.reason === "manual disconnect") {
                        set({ socketState: 'Disconnected', sessionId: null, onlineSessions: 0, onlineInYourUrl: 0, onlineInYourLocation: 0 });
                    }
                    else {
                        set({ socketState: 'Disconnected' });
                    }
                }
            },
            setCurrentUrl: (currentUrl: string) => {
                set({ currentUrl });
            },
            setErrors: (errors: BrowsemErrors) => {
                set({ errors });
            },
            setUrlsOpened: (urlsOpened: string[]) => {
                set({ urlsOpened });
            },
            setUrlOriginsOpened: (urlOriginsOpened: string[]) => {
                set({ urlOriginsOpened });
            },
        }),
        {
            name: "browsem-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
