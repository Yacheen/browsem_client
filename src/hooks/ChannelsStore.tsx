import { ChatterChannel } from '@/components/Channels';
import { create } from 'zustand';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Chatter = {
    username: string,
    session_id: string,
    pfp_s3_key?: string,
}

interface ChannelsStoreState {
    channels: ChatterChannel[],
    setChannels: (channels: ChatterChannel[]) => void,
}

export const useChannelsStore = create<ChannelsStoreState>()(
    persist(
        (set) => ({
            channels: [],
            setChannels: (channels: ChatterChannel[]) => {
                // sort the list by whomever has most chatters. in desc order
                set({ channels: channels.sort((channel1, channel2) => channel1.chatters.length - channel2.chatters.length) });
            },
        }),
        {
            "name": "channel-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
