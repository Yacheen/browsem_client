import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChromeLocalStorage, ChromeSessionStorage } from 'zustand-chrome-storage';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand'
import { ChannelMessage, ChannelMessageSent, ChatterChannel, Connected, Disconnected } from '@/utils/types';

type SocketState = 'Connected' | 'Disconnected' | 'Connecting';
export type CurrentSelection = 'Intro' | 'CreatingGuestUsername' | 'Connected' | 'CreatingChannel';
type BrowsemErrors = {
    noChannelName: string | null,
    channelNameTooLong: string | null,
    channelNameExists: string | null,
};
type PendingReconnection = {
    channelName: string,
}

interface BrowsemStoreState {
    socketState: SocketState,
    currentSelection: CurrentSelection,
    sessionId: string | null,
    username: string,
    errors: BrowsemErrors,
    sessionsOnline: number,
    sessionsInYourOrigin: number,
    sessionsInYourUrl: number,
    currentUrl: string,
    urlsOpened: string[],
    urlOriginsOpened: string[],
    currentTabId: number | null,
    callTabId: number | null,
    chatterChannel: ChatterChannel | null,
    pendingReconnectionFromRefresh: PendingReconnection | null,
    disconnect: () => void,
    disconnected: (message: Disconnected) => void,
    connect: (username: string) => void,
    connected: (message: Connected) => void,
    setUsername: (username: string) => void,
    setCurrentSelection: (currentSelection: CurrentSelection) => void,
    setCurrentUrl: (currentUrl: string) => void,
    setErrors: (errors: BrowsemErrors) => void,
    setUrlsOpened: (urlsOpened: string[]) => void,
    setUrlOriginsOpened: (urlOriginsOpened: string[]) => void,
    setBrowsemStats: (sessionsOnline: number, sessionsInYourOrigin: number, sessionsInYourUrl: number) => void,
    setChatterChannel: (chatterChannel: ChatterChannel | null, callTabId: number | null) => void
    setCurrentTabId: (currentTabId: number | null) => void,
    setPendingReconnectionFromRefresh: (pendingReconnectionFromRefresh: PendingReconnection | null) => void,
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
            sessionsOnline: 0,
            sessionsInYourOrigin: 0,
            sessionsInYourUrl: 0,
            currentUrl: "",
            urlsOpened: [],
            urlOriginsOpened: [],
            currentTabId: null,
            callTabId: null,
            chatterChannel: null,
            pendingReconnectionFromRefresh: null,

            setUsername: (username: string) => {
                set({ username });
            },
            setCurrentSelection: (currentSelection: CurrentSelection) => {
                set({ currentSelection })
            },
            connect: (username: string) => {
                chrome.runtime.sendMessage({
                    "type": "connect",
                    username: username,
                });
                set({ socketState: 'Connecting' });
            },
            disconnect: () => {
                chrome.runtime.sendMessage({
                    "type": "disconnect"
                });
                get().disconnected({Disconnected: { reason: "manual disconnect" }});
            },
            connected: (message: Connected) => {
                let state = get().socketState;
                if (state !== 'Connected') {
                    set({
                        socketState: 'Connected',
                        sessionsOnline: message.Connected.sessionsOnline,
                        sessionId: message.Connected.sessionId,
                    });
                }
            },
            disconnected: async (message: Disconnected) => {
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/screenshare_stopped_sound.wav",
                });
                let state = get().socketState;
                if (state !== 'Disconnected') {
                    if (message.Disconnected.reason === "manual disconnect") {
                        set({
                            socketState: 'Disconnected',
                            sessionId: null,
                            sessionsOnline: 0,
                            sessionsInYourUrl: 0,
                            sessionsInYourOrigin: 0,
                            callTabId: null,
                            chatterChannel: null,
                            pendingReconnectionFromRefresh: null,
                        });
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
                set(state => ({ ...state, errors }));
            },
            setUrlsOpened: (urlsOpened: string[]) => {
                set({ urlsOpened });
            },
            setUrlOriginsOpened: (urlOriginsOpened: string[]) => {
                set({ urlOriginsOpened });
            },
            setBrowsemStats: (sessionsOnline: number, sessionsInYourUrl: number, sessionsInYourOrigin: number) => {
                set({ sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin });
            },
            setChatterChannel: (chatterChannel: ChatterChannel | null, callTabId: number | null) => {
                set({ chatterChannel, callTabId });
            },
            setCurrentTabId: (currentTabId: number | null) => {
                set({ currentTabId });
            },
            setPendingReconnectionFromRefresh: (pendingReconnectionFromRefresh: PendingReconnection | null) => {
                set({ pendingReconnectionFromRefresh });
            },
        }),
        {
            name: "browsem-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
export const STORE_NAME = 'BrowsemStore';
export const browsemStoreBackendReady = () => initPegasusZustandStoreBackend(STORE_NAME, useBrowsemStore, {storageStrategy: "session"});
export const browsemStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useBrowsemStore);
