import { create } from 'zustand';
type Settings = {
    microphoneIsOn: boolean,
    cameraIsOn: boolean,
    sharingScreen: boolean,
    deafened: boolean,
}

interface SettingsStore {
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
