// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
import { ChatterChannel } from '@/components/Channels';
import { Chatter } from './ChannelsStore';

interface CurrentCallStoreState {
    chatters: Chatter[],
    chatterChannel: ChatterChannel | null,
    createdAt: number,
    connectToCall: () => void,
    connectedToCall: () => void,
    reconnectToCall: () => void,
    disconnectedFromCall: () => void,
    disconnectFromCall: () => void,
}

export const useCurrentCallStore = create<CurrentCallStoreState>()(
    () => ({
        chatterChannel: null,
        chatters: [],
        createdAt: 0,
        connectToCall: () => {
            chrome.runtime.sendMessage({
                type: "connect-to-call",
            });
        },
        reconnectToCall: () => {
        },
        connectedToCall: () => {},
        disconnectedFromCall: () => {},
        disconnectFromCall: () => {},
    }),
);
