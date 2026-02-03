import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useBrowsemStore } from '@/hooks/browsemStore';
import IntroPopup from '@/components/IntroPopup';
import MainPopup from '@/components/MainPopup';
import CreateGuestUsernamePopup from '@/components/CreateGuestUsernamePopup';
import { useSettingsStore } from '@/hooks/settingsStore';
import CreateChannel from '@/components/CreateChannel';
import { ChatterChannel } from '@/components/Channels';
import { useChannelsStore } from '@/hooks/ChannelsStore';

export type BackgroundMessage = {
    // this type field is used exclusively for sending messages back and forth for
    // the background script and thats it, I think.
    // any different "types" of msgs will be checked with a typeguard in clientmessage
    type: MessageType,
    contents: ClientMessage
}
type MessageType = "Connecting" | "Connected" | "Disconnected";
export type ClientMessage = Disconnected | Connected | ErrorMessage | ChannelCreated | BrowsemStats;

// general messages
export type BrowsemStats = {
    BrowsemStats: {
        sessionsOnline: number,
        sessionsInYourOrigin: number,
        sessionsInYourUrl: number
    }
}
export type ChannelCreated = {
    ChannelCreated: ChatterChannel
};
export type Connected = {
    Connected: {
        sessionId: string,
        username: string,
        sessionsOnline: number,
    }
};
export type Disconnected = {
    Disconnected: {
        reason: string
    }
};
// errors
type ErrorMessage = {
    ErrorMessage: ErrorType
};
type ErrorType = NoChannelName | ChannelNameTooLong | ChannelNameExists;

type ChannelNameExists = {
    ChannelNameExists: string,
};
type NoChannelName = {
    NoChannelName: string,
};
type ChannelNameTooLong = {
    ChannelNameTooLong: string,
};

// typeguard fns
const isConnected = (msg: ClientMessage): msg is Connected => {
    return (msg as Connected).Connected !== undefined;
};
const isDisconnected = (msg: ClientMessage): msg is Disconnected => {
    return (msg as Disconnected).Disconnected !== undefined;
};
const isErrorMessage = (msg: ClientMessage): msg is ErrorMessage => {
    return (msg as ErrorMessage).ErrorMessage !== undefined;
};
const isNoChannelName = (msg: ErrorType): msg is NoChannelName => {
    return (msg as NoChannelName).NoChannelName !== undefined;
};
const isChannelNameTooLong = (msg: ErrorType): msg is ChannelNameTooLong => {
    return (msg as ChannelNameTooLong).ChannelNameTooLong !== undefined;
};
const isChannelNameExists = (msg: ErrorType): msg is ChannelNameExists => {
    return (msg as ChannelNameExists).ChannelNameExists !== undefined;
};
const isChannelCreated = (msg: ClientMessage): msg is ChannelCreated => {
    return (msg as ChannelCreated).ChannelCreated !== undefined;
};
const isBrowsemStats = (msg: ClientMessage): msg is BrowsemStats => {
    return (msg as BrowsemStats).BrowsemStats !== undefined;
};


export default function App() {
    const [loading, setLoading] = useState<boolean>(false);
    const [connectedUrl, setConnectedUrl] = useState<string | null>();
    const messageListenerExists = useRef(false);
    const browsemStore = useBrowsemStore();
    const settingsStore = useSettingsStore();
    const channelsStore = useChannelsStore();

    const handleConnectToServer = () => {
        browsemStore.connect();
        browsemStore.setCurrentSelection("Connected");
    }
    const handleDisconnectFromServer = () => {
        browsemStore.disconnect();
        browsemStore.setCurrentSelection("Intro");
    };
    const handleCreateGuestUsername = () => {
        browsemStore.setCurrentSelection("CreatingGuestUsername");
    }
    const messageListener = async (message: BackgroundMessage) => {
        console.log('message on client: ', message);
        if (isConnected(message.contents)) {
            browsemStore.connected(message.contents);
            chrome.runtime.sendMessage({
                "type": "update-user-info",
                "contents": JSON.stringify({
                    UpdateInfo: {
                        username: browsemStore.username,
                        settings: settingsStore.settings,
                        // currentUrl: browsemStore.currentUrl,
                        // currentOrigin: new URL(browsemStore.currentUrl).origin,
                        // urlsOpened: browsemStore.urlsOpened,
                        // urlOriginsOpened: browsemStore.urlOriginsOpened,
                    }
                })
            });
            chrome.runtime.sendMessage({
                "type": "update-urls",
            });
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    "type": "get-browsem-stats",
                });
            }, 500);
        } 
        else if (isDisconnected(message.contents)) {
            browsemStore.disconnected(message.contents);
        }
        else if (isChannelCreated(message.contents)) {
            // transition back to main with a message saying it was created. 
            let newChannels = [...channelsStore.channels, message.contents.ChannelCreated];
            channelsStore.setChannels(newChannels);
            browsemStore.setCurrentSelection("Connected");
        }
        // error msges
        else if (isErrorMessage(message.contents)) {
            if (isNoChannelName(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...browsemStore.errors, noChannelName: message.contents.ErrorMessage.NoChannelName });
            }
            else if (isChannelNameTooLong(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...browsemStore.errors, channelNameTooLong: message.contents.ErrorMessage.ChannelNameTooLong });
            }
            else if (isChannelNameExists(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...browsemStore.errors, channelNameExists: message.contents.ErrorMessage.ChannelNameExists });
            }
        }
        else if (isBrowsemStats(message.contents)) {
            let { sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin } = message.contents.BrowsemStats;
            browsemStore.setBrowsemStats(sessionsOnline, sessionsInYourOrigin, sessionsInYourUrl);
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
    }, []);

    // setting info on ws whenever settings or profile updates are made
    // useEffect(() => {
    //     if (browsemStore.currentSelection === "Connected") {
    //         chrome.runtime.sendMessage({
    //             "type": "update-profile",
    //             "contents": JSON.stringify({
    //                 UpdateInfo: {
    //                     username: browsemStore.username,
    //                     settings: settingsStore.settings,
    //                     currentUrl: browsemStore.currentUrl,
    //                     currentOrigin: new URL(browsemStore.currentUrl).origin,
    //                     urlsOpened: browsemStore.urlsOpened,
    //                     urlOriginsOpened: browsemStore.urlOriginsOpened,
    //                 }
    //             })
    //         });
    //     }
    // }, []);

    // test

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
                        <p>{browsemStore.sessionsOnline} online</p>
                        <p>{browsemStore.sessionsInYourOrigin} in your website</p>
                        <p>{browsemStore.sessionsInYourUrl} in your specific URL</p>
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
            browsemStore.currentSelection === 'CreatingChannel'
            ?
                <CreateChannel />
            :
                null
        }
        </>
  )
}
