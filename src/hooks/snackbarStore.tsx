import { create } from 'zustand';
import { Alert, AlertColor, CircularProgress } from '@mui/material';
import { initPegasusZustandStoreBackend, pegasusZustandStoreReady } from '@webext-pegasus/store-zustand';

type SnackbarStore = {
    open: boolean;
    setSnackbar: (active: boolean, message: string, type: AlertColor) => void;
    type: AlertColor;
    message: string;
    closeSnackbar: () => void;
}

export const useSnackbarStore = create<SnackbarStore>()(
    (set, get) => ({
        open: false,
        type: "success",
        message: "",
        setSnackbar: (open: boolean, message: string, type: AlertColor)  => {
            let closeSnackbar = get().closeSnackbar;
            closeSnackbar();
            return set({ open, type, message });
        },
        closeSnackbar: () => {
            setTimeout(() => {
                return set({ open: false, type: "info", message: "" });
            }, 8000);
        },
    })
)


export const STORE_NAME = 'SnackbarStore';
export const snackbarStoreBackendReady = () => initPegasusZustandStoreBackend(STORE_NAME, useSnackbarStore);
export const snackbarStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useSnackbarStore);
