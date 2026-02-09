import { ChatterChannel } from '@/components/Channels';
import { UrlCalls } from '@/popup/App';
import { create } from 'zustand';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Settings } from './settingsStore';

export type Chatter = {
    username: string,
    session_id: string,
    pfp_s3_key?: string,
    settings: Settings,
}

interface ChannelsStoreState {
    // url
    urlCalls: UrlCalls[],
    setUrlCalls: (urlCalls: UrlCalls[]) => void,
}

export const useChannelsStore = create<ChannelsStoreState>()(
    persist(
        (set) => ({
            urlCalls: [],
            setUrlCalls: (urlCalls: UrlCalls[]) => {
                // sort the list by whomever has most chatters. in desc order
                set({ urlCalls });
            },
        }),
        {
            "name": "channel-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
