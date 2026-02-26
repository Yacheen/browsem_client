import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useEffect, useRef, useState } from 'react';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import allStyles from "../../components/AllStyles.scss?inline";
import { useSettingsStore } from '@/hooks/settingsStore';
import { BackgroundMessage, isAnswerFromServer, isIceCandidate, isOfferFromServer } from '@/background';

export default function App() {
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel)
    const callTabId = useCurrentCallStore(state => state.tabId);
    const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const handleOfferFromServer = useCurrentCallStore(state => state.handleOfferFromServer); 
    const handleAnswerFromServer = useCurrentCallStore(state => state.handleAnswerFromServer);
    const handleIceCandidateFromServer = useCurrentCallStore(state => state.handleIceCandidateFromServer);
    const connectedToCall = useCurrentCallStore(state => state.connectedToCall);
    const disconnectFromCall = useCurrentCallStore(state => state.disconnectFromCall);
    const disconnectedFromCall = useCurrentCallStore(state => state.disconnectedFromCall);
    const channelsStore = useChannelsStore();
    const browsemStore = useBrowsemStore();
    const currentCallStore = useCurrentCallStore();
    // im in a call, connectedtocall, its not me, and its in mine
    
    const [currentTabId, setCurrentTabId] = useState(null);
    const messageListenerExists = useRef(false);

    const handleCloseCurrentCall = async () => {
        disconnectFromCall();
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
        if (message.type === "offer-from-server") {
        }
        else if (message.type === "answer-from-server") {
        }
        else if (message.type === "ice-candidate") {
        }
    }
    const handleRefresh = () => {
        currentCallStore.disconnectFromCall();
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
        browsemStore.callTabId === browsemStore.currentTabId && chatterChannel !== null
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

