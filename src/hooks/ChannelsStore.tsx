import { create } from 'zustand';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand'
import { UrlCalls } from '@/utils/types';


interface ChannelsStoreState {
    // url
    urlCalls: UrlCalls[],
    setUrlCalls: (urlCalls: UrlCalls[]) => void,
    setUrlCallsWithPrevState: (updater: (prev: UrlCalls[]) => UrlCalls[]) => void;
}

export const useChannelsStore = create<ChannelsStoreState>()(
    // persist(
        (set) => ({
            urlCalls: [],
            setUrlCallsWithPrevState: (updater) => set(state => ({ urlCalls: updater(state.urlCalls) })),
            setUrlCalls: (urlCalls: UrlCalls[]) => {
                // sort the list by whomever has most chatters. in desc order
                set({ urlCalls });
            },
        }),
    //     {
    //         "name": "channel-session-storage",
    //         storage: createJSONStorage(() => ChromeSessionStorage)
    //     }
    // )
);
export const STORE_NAME = 'ChannelsStore';
export const channelsStoreBackendReady = () => initPegasusZustandStoreBackend(STORE_NAME, useChannelsStore, { storageStrategy: "session" });
export const channelsStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useChannelsStore);
