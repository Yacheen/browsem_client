import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useEffect, useRef, useState } from 'react';
import { ChatterChannel } from '@/components/Channels';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import allStyles from "../../components/AllStyles.scss?inline";
import { useSettingsStore } from '@/hooks/settingsStore';
import { BackgroundMessage, ConnectedToCall, isAnswerFromServer, isConnectedToCall, isDisconnectedFromCall, isIceCandidate, isOfferFromServer, isUserUpdatedSettings } from '@/popup/App';

export default function App() {
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel)
    const callTabId = useCurrentCallStore(state => state.tabId);
    const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const handleOfferFromServer = useCurrentCallStore(state => state.handleOfferFromServer); 
    const handleAnswerFromServer = useCurrentCallStore(state => state.handleAnswerFromServer);
    const handleIceCandidateFromServer = useCurrentCallStore(state => state.handleIceCandidateFromServer);
    const handleUserUpdatedSettings = useCurrentCallStore(state => state.handleUserUpdatedSettings);
    const connectedToCall = useCurrentCallStore(state => state.connectedToCall);
    const disconnectFromCall = useCurrentCallStore(state => state.disconnectFromCall);
    const disconnectedFromCall = useCurrentCallStore(state => state.disconnectedFromCall);
    const channelsStore = useChannelsStore();
    
    const [currentTabId, setCurrentTabId] = useState(null);
    const messageListenerExists = useRef(false);

    const handleStorageChange = (changes: {[key: string]: chrome.storage.StorageChange}, areaName: string) => {
        if (areaName === "session") {
            if (changes['current-call-session-storage']) {
                console.log(changes);
                useCurrentCallStore.persist.rehydrate();
                console.log('hi');
            }
            else if (changes['browsem-session-storage']) {
                useBrowsemStore.persist.rehydrate();
                console.log('hi');
            }
            else if (changes['channel-session-storage']) {
                useChannelsStore.persist.rehydrate();
                console.log('hi');
            }
        }
    }
    const handleCloseCurrentCall = async () => {
        disconnectFromCall();
    };
    useEffect(() => {
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        }
    }, []);
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

    useEffect(() => {
        // chrome.runtime.onMessage.addListener(handleRuntimeMessage);
        chrome.runtime.sendMessage({ type: "get-tab-id"}, response => {
            if (response && response.tabId) {
                console.log('SETTING THE CURRENT TABBBBBBBBBB');
                setCurrentTabId(response.tabId);
            }
        });
    }, [callTabId]);

    // handling messages, opens when browsemstore gets username from storage session,
    // which happens when popup is opened.
    const messageListener = async (message: BackgroundMessage) => {
        if (isOfferFromServer(message.contents)) {
            handleOfferFromServer(message.contents);
        }
        else if (isAnswerFromServer(message.contents)) {
            handleAnswerFromServer(message.contents);
        }
        else if (isIceCandidate(message.contents)) {
            handleIceCandidateFromServer(message.contents);
        }
        else if (isUserUpdatedSettings(message.contents)) {
            handleUserUpdatedSettings(message.contents);
        }
        else if (isConnectedToCall(message.contents)) {
            if (message.contents.ConnectedToCall.connectedChatter) {
                // add them to ur current call.
                let newUrlCalls = useChannelsStore.getState().urlCalls;
                newUrlCalls.map(urlCall => {
                    if (urlCall.urlName === useCurrentCallStore.getState().chatterChannel?.fullUrl) {
                        urlCall.channels.map(channel => {
                            if (channel.channelName === useCurrentCallStore.getState().chatterChannel?.channelName) {
                                channel.chatters.push({
                                    sessionId: useBrowsemStore.getState().sessionId ?? "", 
                                    username: useBrowsemStore.getState().username,
                                    settings: useSettingsStore.getState().settings,
                                    pfpS3Key: "",
                                });
                            }
                            return channel;
                        })

                    }
                    return urlCall;
                })
                channelsStore.setUrlCalls(newUrlCalls);
                connectedToCall(message.contents);
            }
            else {
                connectedToCall(message.contents);
            }
        }
        else if (isDisconnectedFromCall(message.contents)) {
            if (message.contents.DisconnectedFromCall.reason !== "unknown") {
                setSettings({
                    ...useSettingsStore.getState().settings,
                    cameraIsOn: false,
                    microphoneIsOn: false,
                    sharingScreen: false,
                });
            }
            await disconnectedFromCall(message.contents);
        }
    }
    useEffect(() => {
        if (messageListenerExists.current === false) {
            chrome.runtime.onMessage.addListener(messageListener)
            messageListenerExists.current = true;
        }
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
            messageListenerExists.current = false;
        }
    }, []);
    return (
        useCurrentCallStore.getState().tabId === currentTabId && chatterChannel !== null
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

