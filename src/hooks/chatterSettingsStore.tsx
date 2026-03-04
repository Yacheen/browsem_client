import { create } from 'zustand';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand'

interface ChatterSettingsState {
    chatterSettings: ChatterSetting[]
    setChatterSettings: (chatterSettings: ChatterSetting[]) => void,
}
export type ChatterSetting = {
    username: string,
    screenshareVolume: number,
    microphoneVolume: number,
    hidingVideo: false,
}

export const useChatterSettingsStore = create<ChatterSettingsState>()(
    persist(
        (set) => ({
            chatterSettings: [],
            setChatterSettings: (chatterSettings: ChatterSetting[]) => {
                set({ chatterSettings });
            }
        }),
        {
            "name": "chatter-settings-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
