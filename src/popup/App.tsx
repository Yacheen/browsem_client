import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useBrowsemStore } from '@/hooks/browsemStore';
import IntroPopup from '@/components/IntroPopup';
import MainPopup from '@/components/MainPopup';
import CreateGuestUsernamePopup from '@/components/CreateGuestUsernamePopup';
import { useSettingsStore } from '@/hooks/settingsStore';
import CreateChannel from '@/components/CreateChannel';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName } from '@/utils/functions';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { BackgroundMessage, IceCandidate } from '../utils/types.ts';

export default function App() {
    const messageListenerExists = useRef(false);
    const browsemStore = useBrowsemStore();
    const socketState = useBrowsemStore(state => state.socketState);

    const handleConnectToServer = () => {
        browsemStore.connect();
    }
    const handleDisconnectFromServer = async () => {
        // this wont need to be called when u appropriately leave all related areas (like channels and what-not)
        // as it'll do it for you whilst disconnecting.
        useCurrentCallStore.getState().disconnectFromCall(true);
        browsemStore.disconnect();
        browsemStore.setCurrentSelection("Intro");
    };
    const handleCreateGuestUsername = () => {
        browsemStore.setCurrentSelection("CreatingGuestUsername");
    }
    // useEffect(() => {
    //     chrome.runtime.sendMessage({ type: "get-tab-id" }, (response) => {
    //         if (response?.tabId) {
    //             console.log('setting currenttabid in popup: ', response);
    //             useBrowsemStore.getState().setCurrentTabId(response.tabId);
    //         }
    //     });
    // }, []);
    // const messageListener = async (message: BackgroundMessage) => {
    //     if (message.type === "offer-from-server") {
    //     }
    //     else if (message.type === "answer-from-server") {
    //     }
    // };

    // useEffect(() => {
    //     if (messageListenerExists.current === false) {
    //         chrome.runtime.onMessage.addListener(messageListener)
    //         messageListenerExists.current = true;
    //     }
    //     return () => {
    //         chrome.runtime.onMessage.removeListener(messageListener);
    //         messageListenerExists.current = false;
    //     }
    // }, []);
    useEffect(() => {
        if (socketState === "Connected") {
            chrome.runtime.sendMessage({
                "type": "get-browsem-stats",
            });
            // can do origins as well instead in future
            chrome.runtime.sendMessage({
                "type": "get-channels-by-origins",
            });
        }
    }, []);

  return (
      <>
        <div className={`${browsemStore.socketState === 'Connected' ? "browsem-header-connected" : ''}  ${browsemStore.currentSelection === "Connected" ? 'slide-left-animation' : ''}`}>
            <h1>Browsem</h1>
            {
                browsemStore.socketState === 'Connected'
                ?
                    <p className={"connected-as-username"}>Connected as {browsemStore.username}</p>
                :
                browsemStore.currentSelection === "Connected"
                ?
                    <p>Disconnected. Attempting to reconnect...</p>
                :
                    null
            }
            {
                browsemStore.socketState === 'Connected'
                ?
                <div className="top-right">
                    {/* sessions online, sessions in ur general site (yt/twitter/reddit etc.), sessions on ur specific url */}
                    <div className="disconnect-btn-container">
                        { /*  if userData, show logout instead. */ }
                        <button onClick={handleDisconnectFromServer} type="button">Disconnect</button>
                    </div>
                    <div className="server-stats">
                        <p className="read-the-docs">chatters</p>
                        <p>{browsemStore.sessionsOnline} on Browsem</p>
                        <p>{browsemStore.sessionsInYourOrigin} on {getDomainName(browsemStore.currentUrl)}</p>
                        {
                            /* 
                                 insert big switch case based on ur origin what this should be here
                                 (for example, if youtube, 200 watching this video)
                                 (for twitch, 30 watching xqc's stream)
                            */
                        }
                        <p>{browsemStore.sessionsInYourUrl} on your URL</p>
                    </div>
                </div>
                :
                null
            }
        </div>
        {
            browsemStore.currentSelection === 'Intro'
            ?
                <IntroPopup handleCreateGuestUsername={handleCreateGuestUsername} />
            :
            browsemStore.currentSelection === 'CreatingGuestUsername'
            ?
                <CreateGuestUsernamePopup username={browsemStore.username} setUsername={browsemStore.setUsername} handleConnectToServer={handleConnectToServer} />
            :

            browsemStore.currentSelection === 'Connected'
            ?
                <MainPopup />
            :
            browsemStore.currentSelection === 'CreatingChannel'
            ?
                <CreateChannel />
            :
                null
        }
        </>
  )
}
