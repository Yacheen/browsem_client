import { create } from 'zustand';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand'
import { Settings } from '@/utils/types';

export interface SettingsStore {
    settings: Settings,
    setSettings: (settings: Settings) => void,
}

export const useSettingsStore = create<SettingsStore>()(
    (set) => ({
        settings: {
            deafened: false,
            cameraIsOn: false,
            microphoneIsOn: false,
            sharingScreen: false,
        },
        setSettings: (settings: Settings) => {
            set({ settings })
        },
    }),
);
export const STORE_NAME = 'SettingsStore';
export const settingsStoreBackendReady = () => initPegasusZustandStoreBackend(STORE_NAME, useSettingsStore);
export const settingsStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useSettingsStore);
