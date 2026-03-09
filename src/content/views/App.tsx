import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { use, useEffect, useRef, useState } from 'react';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import allStyles from "../../components/AllStyles.scss?inline";
import { useSettingsStore } from '@/hooks/settingsStore';
import { BackgroundMessage, isAnswerFromServer, isDisconnectedFromCall, isIceCandidate, isOfferFromServer } from '@/utils/types';
import { useSnackbarStore } from '@/hooks/snackbarStore';
import { Alert, Snackbar } from '@mui/material';
import Slide from '@mui/material/Slide';

export default function App() {
    const chatterChannel = useBrowsemStore(state => state.chatterChannel)
    const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const disconnectFromCall = useCurrentCallStore(state => state.disconnectFromCall);
    const browsemStore = useBrowsemStore();
    const callTabId = useBrowsemStore(state => state.callTabId);
    const currentCallStore = useCurrentCallStore();
    const peerConnection = useCurrentCallStore(state => state.peerConnection);
    const [currentTabId, setCurrentTabId] = useState<number | null>(null);
    const [refreshPendingInfo, setRefreshPendingInfo] = useState<null | { urlName: string, channelName: string }>(null);
    const message = useSnackbarStore(state => state.message);
    const open = useSnackbarStore(state => state.open);
    const type = useSnackbarStore(state => state.type);
    const setSnackbar = useSnackbarStore(state => state.setSnackbar);
    const focusedWindow = useCurrentCallStore(state => state.focusedWindow);
    const setFocusedWindow = useCurrentCallStore(state => state.setFocusedWindow);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: "get-tab-id" }, (response) => {
            if (response?.tabId) {
                setCurrentTabId(response.tabId);
            }
        });
    }, []);
    useEffect(() => {
        if (chatterChannel && !refreshPendingInfo) {
            setRefreshPendingInfo({ urlName: chatterChannel.fullUrl, channelName: chatterChannel.channelName });
        }
    }, [chatterChannel, refreshPendingInfo]);

    const handleCloseCurrentCall = async () => {
        disconnectFromCall(true);
    };

    useEffect(() => {
        chrome.runtime.sendMessage({
            "type": "update-user-info",
            "contents": JSON.stringify({
                UpdateInfo: {
                    username: useBrowsemStore.getState().username,
                    settings: settings,
                }
            })
        });
    }, [settings]);

    // handling messages, opens when browsemstore gets username from storage session,
    // which happens when popup is opened.
    // const messageListener = async (message: BackgroundMessage) => {
    //     if (isOfferFromServer(message.contents)) {
    //         currentCallStore.handleOfferFromServer(message.contents);
    //     }
    //     else if (isAnswerFromServer(message.contents)) {
    //         currentCallStore.handleAnswerFromServer(message.contents);
    //     }
    //     else if (isIceCandidate(message.contents)) {
    //         currentCallStore.handleIceCandidateFromServer(message.contents);
    //     }
    //     else if (isDisconnectedFromCall(message.contents)) {
    //         await currentCallStore.disconnectedFromCall(message.contents);
    //     }
    // }
    const handleRefresh = () => {
        if (useBrowsemStore.getState().chatterChannel) {
            useBrowsemStore.getState().setPendingReconnectionFromRefresh({ channelName: useBrowsemStore.getState().chatterChannel!.channelName });
        }
    }
    useEffect(() => {
        window.addEventListener('beforeunload', handleRefresh);
        return () => {
            window.removeEventListener('beforeunload', handleRefresh);
        }
    }, []);
    useEffect(() => {
        if (useBrowsemStore.getState().pendingReconnectionFromRefresh) {
            setSettings({
                ...useSettingsStore.getState().settings,
                cameraIsOn: false,
                microphoneIsOn: false,
                sharingScreen: false,
            });
            chrome.runtime.sendMessage({
                type: "reconnect-to-call",
            });
        }
    }, []);
    return (
        callTabId === currentTabId && callTabId !== null
        ?
            <>
                <style>{allStyles}</style>
                <WindowHandler minWidth={570} minHeight={46} type='BrowsemCall' description={chatterChannel?.fullUrl} closeMyWindow={handleCloseCurrentCall}>
                    <BrowsemCall />
                </WindowHandler>
                {
                    open 
                    ?
                        <Snackbar
                            anchorOrigin={{vertical: "top", horizontal: "center"}}
                            open={open}
                            TransitionComponent={Slide}
                            message={message}
                            key={message}
                            sx={{
                                zIndex: 6942013375,
                                pointerEvents: "auto",
                                '& .MuiSvgIcon-root': {
                                    fontSize: '20px', // Increases icon size
                                    // color: type === "success" ? "hsl(120, 93%, 70%)" : type === "info" ? 'hsl(0, 0%, 90%)' : type === "error" ? "hsl(0, 99%, 67%)" : type === "warning" ? "hsl(22, 100%, 60%)" : "hsl(0, 0%, 90%)",
                                },
                                '& .MuiAlert-icon': {
                                    fontSize: '20px', // Increases icon size
                                    color: type === "success" ? "hsl(120, 93%, 70%)" : type === "info" ? 'hsl(0, 0%, 90%)' : type === "error" ? "hsl(0, 99%, 67%)" : type === "warning" ? "hsl(22, 100%, 60%)" : "hsl(0, 0%, 90%)",
                                },
                                '& .MuiAlert-message': {
                                    fontSize: '14px', // Increases text size
                                },
                            }}
                        >
                            <Alert style={{background: "hsla(0, 0%, 30%, 1)", color: "white"}} onClose={() => setSnackbar(false, "", "success")} severity={type}>
                                {message}
                            </Alert>
                        </Snackbar>
                    :
                        null
                }
            </>
        :
            null
    )
}

