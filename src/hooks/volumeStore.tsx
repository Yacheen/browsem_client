import { create } from 'zustand';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChromeLocalStorage, ChromeSessionStorage } from 'zustand-chrome-storage';

type VolumeStore = {
    volume: number,
    setVolume: (volume: number) => void,
}

export const useVolumeStore = create<VolumeStore>()(
    persist(
        (set) => ({
            volume: 25,
            setVolume: (volume: number) => {
                set({ volume });
            }
        }),
        {
            name: "volume-settings-storage",
            storage: createJSONStorage(() => ChromeLocalStorage),
        }
    ),
)


export const STORE_NAME = 'VolumeStore';
export const volumeStoreBackendReady = () => initPegasusZustandStoreBackend(STORE_NAME, useVolumeStore);
export const volumeStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useVolumeStore);
