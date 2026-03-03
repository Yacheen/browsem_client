import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { use, useEffect, useRef, useState } from 'react';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import allStyles from "../../components/AllStyles.scss?inline";
import { useSettingsStore } from '@/hooks/settingsStore';
import { BackgroundMessage, isAnswerFromServer, isDisconnectedFromCall, isIceCandidate, isOfferFromServer } from '@/utils/types';

export default function App() {
    const chatterChannel = useBrowsemStore(state => state.chatterChannel)
    const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const disconnectFromCall = useCurrentCallStore(state => state.disconnectFromCall);
    const browsemStore = useBrowsemStore();
    const callTabId = useBrowsemStore(state => state.callTabId);
    const currentCallStore = useCurrentCallStore();
    const peerConnection = useCurrentCallStore(state => state.peerConnection);
    const messageListenerExists = useRef(false);
    const [currentTabId, setCurrentTabId] = useState<number | null>(null);
    const [refreshPendingInfo, setRefreshPendingInfo] = useState<null | { urlName: string, channelName: string }>(null);


    useEffect(() => {
        chrome.runtime.sendMessage({ type: "get-tab-id" }, (response) => {
            console.log('content script got a response: ', response);
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

    // whenever channelChatter and callTabId changes, handle currentcallstore accordingly.
    // information about currentcall gets set after receiving an offer from server,
    // which will in turn show the window. when browsemStore.calltabid and chatterchannel goes null,
    // we kill the window.
    // useEffect(() => {
    //     if (callTabId) {
    //         if (peerConnection === null) {
    //             currentCallStore.startPeerConnection();
    //         }
    //     }
    // }, [callTabId, peerConnection]);

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
    const messageListener = async (message: BackgroundMessage) => {
        console.log('got a message from background server: ', message);
        if (isOfferFromServer(message.contents)) {
            currentCallStore.handleOfferFromServer(message.contents);
        }
        else if (isAnswerFromServer(message.contents)) {
            currentCallStore.handleAnswerFromServer(message.contents);
        }
        else if (isIceCandidate(message.contents)) {
            currentCallStore.handleIceCandidateFromServer(message.contents);
        }
        else if (isDisconnectedFromCall(message.contents)) {
            console.log('received isdisconnectedfromcall on content script, dcing..');
            await currentCallStore.disconnectedFromCall(message.contents);
        }
    }
    const handleRefresh = () => {
        if (useBrowsemStore.getState().chatterChannel) {
            useBrowsemStore.getState().setPendingReconnectionFromRefresh({ channelName: useBrowsemStore.getState().chatterChannel!.channelName });
        }
    }
    useEffect(() => {
        if (messageListenerExists.current === false) {
            chrome.runtime.onMessage.addListener(messageListener)
            messageListenerExists.current = true;
            window.addEventListener('beforeunload', handleRefresh);
        }
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
            messageListenerExists.current = false;
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
    // useEffect(() => {
    //     chrome.runtime.sendMessage({
    //         "type": "update-user-info",
    //         "contents": JSON.stringify({
    //             UpdateInfo: {
    //                 username: useBrowsemStore.getState().username,
    //                 settings: settings,
    //             }
    //         })
    //     });
    // }, [settings]);
    return (
        callTabId === currentTabId && callTabId !== null
        ?
            <>
                <style>{allStyles}</style>
                <WindowHandler minWidth={570} minHeight={46} type='BrowsemCall' description={chatterChannel?.fullUrl} closeMyWindow={handleCloseCurrentCall}>
                    <BrowsemCall />
                </WindowHandler>
            </>
        :
            null
    )
}

