import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useEffect, useRef, useState } from 'react';
import { ChatterChannel } from '@/components/Channels';
import { Chatter, useChannelsStore } from '@/hooks/ChannelsStore';
import allStyles from "../../components/AllStyles.scss?inline";
import { useSettingsStore } from '@/hooks/settingsStore';
import { BackgroundMessage, ConnectedToCall, DisconnectedFromCall, isAnswerFromServer, isConnectedToCall, isDisconnected, isDisconnectedFromCall, isIceCandidate, isOfferFromServer, isUserUpdatedSettings } from '@/popup/App';

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
    // im in a call, connectedtocall, its not me, and its in mine
    
    const [currentTabId, setCurrentTabId] = useState(null);
    const messageListenerExists = useRef(false);

    const handleStorageChange = (changes: {[key: string]: chrome.storage.StorageChange}, areaName: string) => {
        if (areaName === "session") {
            // if (changes['current-call-session-storage']) {
            //     useCurrentCallStore.persist.rehydrate();
            // }
            if (changes['browsem-session-storage']) {
                useBrowsemStore.persist.rehydrate();
            }
            else if (changes['channel-session-storage']) {
                useChannelsStore.persist.rehydrate();
            }
        }
    }
    const handleCloseCurrentCall = async () => {
        await disconnectFromCall(true);
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
                setCurrentTabId(response.tabId);
            }
        });
    }, [useCurrentCallStore.getState().tabId]);

    // handling messages, opens when browsemstore gets username from storage session,
    // which happens when popup is opened.
    const messageListener = async (message: BackgroundMessage) => {
        console.log('message  received: on contentscript: ', message);
        if (message.type === "disconnected-from-socket") {
            await disconnectFromCall(true);
        }
        else if (isOfferFromServer(message.contents)) {
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
            console.log('received isconnected message.');
            // add them to the channel they were added to.
            let newUrlCalls = useChannelsStore.getState().urlCalls;
            let msg: ConnectedToCall = message.contents;
            let chatterChannelHandle: ChatterChannel | undefined;
            newUrlCalls.map(urlCall => {
                if (urlCall.urlName === msg.ConnectedToCall.urlName) {
                    urlCall.channels.map(channel => {
                        if (channel.channelName === msg.ConnectedToCall.channelName) {
                            chatterChannelHandle = channel;
                            channel.chatters.push(msg.ConnectedToCall.connectedChatter);
                        }
                        return channel;
                    })
                }
                return urlCall;
            })
            channelsStore.setUrlCalls(newUrlCalls);

            if (chatterChannelHandle) {
                if (msg.ConnectedToCall.connectedChatter.username === useBrowsemStore.getState().username) {
                    await connectedToCall(message.contents, true, chatterChannelHandle);
                }
                else {
                    await connectedToCall(message.contents, false, chatterChannelHandle);
                }
            }
        }
        else if (isDisconnectedFromCall(message.contents)) {
            console.log('received disconnectedformcall msg: ', message.contents)
            let newUrlCalls = useChannelsStore.getState().urlCalls;
            let msg: DisconnectedFromCall = message.contents;
            newUrlCalls.map(urlCall => {
                if (urlCall.urlName === msg.DisconnectedFromCall.urlName) {
                    urlCall.channels.map(channel => {
                        if (channel.channelName === msg.DisconnectedFromCall.channelName) {
                            channel.chatters = channel.chatters.filter(chatter => chatter.username != msg.DisconnectedFromCall.disconnectedChatter.username);
                        }
                        return channel;
                    })
                }
                return urlCall;
            })
            channelsStore.setUrlCalls(newUrlCalls);
            if (msg.DisconnectedFromCall.channelName === useCurrentCallStore.getState().chatterChannel?.channelName) {
                if (msg.DisconnectedFromCall.disconnectedChatter.username === useBrowsemStore.getState().username) {
                    setSettings({
                        ...useSettingsStore.getState().settings,
                        cameraIsOn: false,
                        microphoneIsOn: false,
                        sharingScreen: false,
                    });
                    await disconnectedFromCall(message.contents, true);
                }
                else {
                    await disconnectedFromCall(message.contents, false);
                }
            }
        }
        // else if (isDisconnected(message.contents)) {
        //     await disconnectFromCall(true);
        //     // await currentCallStore.disconnectedFromCall({DisconnectedFromCall: { reason: message.contents.Disconnected.reason, disconnectedChatter: null }});
        // }
    }
    const handleRefresh = async () => {
        chrome.runtime.sendMessage({ type: "get-tab-id"}, response => {
            if (response && response.tabId) {
                if (useCurrentCallStore.getState().tabId === response.tabId) {
                    disconnectFromCall(true);
                }
            }
        });
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

