import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useBrowsemStore } from '@/hooks/browsemStore';
import IntroPopup from '@/components/IntroPopup';
import MainPopup from '@/components/MainPopup';
import CreateGuestUsernamePopup from '@/components/CreateGuestUsernamePopup';
import { useSettingsStore } from '@/hooks/settingsStore';

export type BackgroundMessage = {
    // this type field is used exclusively for 
    type: MessageType,
    contents: ClientMessage
}

type ClientMessage = Disconnected | Connected;

export type Disconnected = {
    Disconnected: {
        reason: string
    }
};

export type Connected = {
    Connected: {
        sessionId: string,
        onlineSessions: number
        username: string,
    }
};

type MessageType = "Connecting" | "Connected" | "Disconnected";

// typeguard fns
const isConnected = (msg: ClientMessage): msg is Connected => {
    return (msg as Connected).Connected !== undefined;
};
const isDisconnected = (msg: ClientMessage): msg is Disconnected => {
    return (msg as Disconnected).Disconnected !== undefined;
};


export default function App() {
    const [loading, setLoading] = useState<boolean>(false);
    const [connectedUrl, setConnectedUrl] = useState<string | null>();
    const messageListenerExists = useRef(false);
    const browsemStore = useBrowsemStore();
    const settingsStore = useSettingsStore();

    const handleConnectToServer = () => {
        if (browsemStore.socketState === 'Disconnected') {
            browsemStore.connect();
            browsemStore.setCurrentSelection("Connected");
        }
        else if (browsemStore.socketState === 'Connected') {
            browsemStore.disconnect();
            browsemStore.setCurrentSelection("Intro");
        }
    }
    const handleCreateGuestUsername = () => {
        browsemStore.setCurrentSelection("CreatingGuestUsername");
    }
    const messageListener = async (message: BackgroundMessage) => {
        if (isConnected(message.contents)) {
            browsemStore.connected(message.contents);
            chrome.runtime.sendMessage({
                "type": "update-profile",
                "contents": JSON.stringify({
                    UpdateInfo: {
                        username: browsemStore.username,
                        settings: settingsStore.settings
                    }
                })
            });
        } 
        else if (isDisconnected(message.contents)) {
            browsemStore.disconnected(message.contents);
        }
    };

    // handling messages. Does this only handle it while the popup is up?
    useEffect(() => {
        if (messageListenerExists.current === false) {
            chrome.runtime.onMessage.addListener(messageListener)
            messageListenerExists.current = true;
        }
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
            messageListenerExists.current = false;
        }
    }, [browsemStore.username, settingsStore.settings]);

    // setting info on ws whenever settings or profile updates are made
    useEffect(() => {
        if (browsemStore.currentSelection === "Connected") {
            chrome.runtime.sendMessage({
                "type": "update-profile",
                "contents": JSON.stringify({
                    UpdateInfo: {
                        username: browsemStore.username,
                        settings: settingsStore.settings
                    }
                })
            });
        }
    }, [browsemStore.username, settingsStore.settings]);

    // test

  return (
      <>
        <div className={browsemStore.socketState === 'Connected' ? "browsem-header-connected" : ''}>
            <h1>Browsem</h1>
            {
                browsemStore.socketState === 'Connected'
                ?
                    <p className={"connected-as-username"}>Connected as {browsemStore.username}</p>
                :
                    null
            }
            {
                browsemStore.socketState === 'Connected'
                ?
                <div className="top-right">
                    {/* sessions online, sessions in ur general site (yt/twitter/reddit etc.), sessions on ur specific url */}
                    <div className="disconnect-btn-container">
                        <button type="button">Disconnect</button>
                    </div>
                    <div className="server-stats">
                        <p>{browsemStore.onlineSessions} online</p>
                        <p>{browsemStore.onlineInYourUrl} in your website</p>
                        <p>{browsemStore.onlineInYourLocation} in your specific URL</p>
                    </div>
                </div>
                :
                null
            }
        </div>
        {
            browsemStore.currentSelection === 'Intro'
            ?
                <IntroPopup msg="Vite + React + CRXJS" handleCreateGuestUsername={handleCreateGuestUsername} />
            :
            browsemStore.currentSelection === 'CreatingGuestUsername'
            ?
                <CreateGuestUsernamePopup username={browsemStore.username} setUsername={browsemStore.setUsername} handleConnectToServer={handleConnectToServer} />
            :

            browsemStore.currentSelection === 'Connected'
            ?
                <MainPopup />
            :
                null
        }
        </>
  )
}
