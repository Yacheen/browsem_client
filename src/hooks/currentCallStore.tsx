// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
import { ChatterChannel } from '@/components/Channels';
import { Chatter } from './ChannelsStore';
import { ConnectedToCall, DisconnectedFromCall } from '@/popup/App';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChromeSessionStorage } from 'zustand-chrome-storage';

interface CurrentCallStoreState {
    chatterChannel: ChatterChannel | null,
    tabId: number | null,
    setChatterChannel: (chatterChannel: ChatterChannel | null) => void,
    connectToCall: (channelName: string) => void,
    connectedToCall: (msg: ConnectedToCall, tabId: number) => void,
    reconnectToCall: (channelName: string) => void,
    disconnectedFromCall: (msg: DisconnectedFromCall) => void,
    disconnectFromCall: () => void,
}

export const useCurrentCallStore = create<CurrentCallStoreState>()(
    persist(
        (set, get) => ({
            chatterChannel: null,
            tabId: null,
            setChatterChannel: (chatterChannel: ChatterChannel | null) => {
                set({ chatterChannel });
            },
            connectToCall: (channelName: string) => {
                chrome.runtime.sendMessage({
                    type: "connect-to-call",
                    channelName: channelName,
                });
            },
            reconnectToCall: (channelName: string) => {
                chrome.runtime.sendMessage({
                    type: "reconnect-to-call",
                    channelName: channelName,
                });
            },
            connectedToCall: (msg: ConnectedToCall, tabId: number) => {
                if (msg.ConnectedToCall.chatterChannel !== null) {
                    set({ chatterChannel: msg.ConnectedToCall.chatterChannel, tabId });
                }
                else if (msg.ConnectedToCall.connectedChatter !== null) {
                    let chatterChannel = get().chatterChannel;
                    let newChatterChannel = chatterChannel;
                    newChatterChannel?.chatters.push(msg.ConnectedToCall.connectedChatter);

                    set({ chatterChannel: newChatterChannel });
                }
            },
            disconnectedFromCall: (msg: DisconnectedFromCall) => {
                if (msg.DisconnectedFromCall.reason !== null) {
                    console.log('disconnected from call, reason: ', msg.DisconnectedFromCall.reason);
                    set({ chatterChannel: null });
                }
                else if (msg.DisconnectedFromCall.disconnectedChatter) {
                    let chatterChannel = get().chatterChannel;
                    if (chatterChannel) {
                        let newChatters = chatterChannel.chatters.filter(chatter => chatter.session_id !== msg.DisconnectedFromCall.disconnectedChatter?.session_id);

                        set({ chatterChannel: { ...chatterChannel, chatters: newChatters } });
                    }
                }
            },
            disconnectFromCall: () => {
                chrome.runtime.sendMessage({
                    type: "disconnect-from-call",
                });
            },
        }),
        {
            name: "current-call-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
