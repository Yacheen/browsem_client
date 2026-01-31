import { create } from 'zustand';

interface CreatingChannelState {
    channelName: string,
    maxChatters: number,
    setChannelname: (channelName: string) => void,
    setMaxChatters: (maxChatters: number) => void,
    create: (fullUrl: string) => void,
}

export const useCreatingChannelStore = create<CreatingChannelState>()(
    (set, get) => ({
        channelName: "",
        maxChatters: 10,
        setChannelname: (channelName: string) => {
            set({ channelName });
        },
        setMaxChatters: (maxChatters: number) => {
            set({ maxChatters });
        },
        create: (url: string) => {
            let channelName = get().channelName;
            let maxChatters = get().maxChatters;
            let urlOrigin = new URL(url).origin;
            chrome.runtime.sendMessage({
                "type": "create-channel",
                "contents": JSON.stringify({
                    CreateChannel: {
                        channelName: channelName,
                        maxChatters: maxChatters,
                        urlOrigin: urlOrigin,
                        fullUrl: url,
                    }
                })
            });
        }
    }),
);
