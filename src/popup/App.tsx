import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useBrowsemStore } from '@/hooks/browsemStore';
import IntroPopup from '@/components/IntroPopup';
import MainPopup from '@/components/MainPopup';
import CreateGuestUsernamePopup from '@/components/CreateGuestUsernamePopup';
import { Settings, useSettingsStore } from '@/hooks/settingsStore';
import CreateChannel from '@/components/CreateChannel';
import { ChatterChannel } from '@/components/Channels';
import { Chatter, useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName } from '@/utils/functions';
import { IceCandidate, useCurrentCallStore } from '@/hooks/currentCallStore';

export type BackgroundMessage = {
    // this type field is used exclusively for sending messages back and forth for
    // the background script and thats it, I think.
    // any different "types" of msgs will be checked with a typeguard in clientmessage
    type: MessageType,
    contents: ClientMessage
}
type MessageType = "Connecting" | "Connected" | "Disconnected";
export type ClientMessage = Disconnected | Connected | ErrorMessage | ChannelCreated | BrowsemStats | OriginCalls | UrlsUpdated | ConnectedToCall | DisconnectedFromCall | AnswerFromServer | OfferFromServer | IceCandidate | UserUpdatedSettings;

// general messages
export type BrowsemStats = {
    BrowsemStats: {
        sessionsOnline: number,
        sessionsInYourOrigin: number,
        sessionsInYourUrl: number
    }
}
export type ChannelCreated = {
    ChannelCreated: UrlCalls,
};
export type Connected = {
    Connected: {
        sessionId: string,
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
export type OriginCalls = {
    OriginCalls: {
        originName: string,
        urls: UrlCalls[],
    }
}
export type UrlCalls = {
    urlName: string,
    channels: ChatterChannel[],
}
type UrlsUpdated = {
    UrlsUpdated: string,
}
 // ConnectedToCall | DisconnectedFromCall | AnswerFromServer | OfferFromServer
export type ConnectedToCall = {
    ConnectedToCall: {
        connectedChatter: Chatter | null,
        chatterChannel: ChatterChannel | null,
    }
}
export type DisconnectedFromCall = {
    DisconnectedFromCall: {
        disconnectedChatter: Chatter | null,
        reason: string | null,
    } 
}
export type AnswerFromServer = {
    AnswerFromServer: RTCSessionDescription 
}
export type OfferFromServer = {
    OfferFromServer: RTCSessionDescription 
}
export type OfferFromClient = {
    OfferFromClient: RTCSessionDescription 
}
export type AnswerFromClient = {
    AnswerFromClient: RTCSessionDescription 
}
export type UserUpdatedSettings = {
    UserUpdatedSettings: {
        settings: Settings,
        // SESSIONS ID, NOT CALL NAME
        currentCall: string,
        username: string,
        callSessionId: string,
    }
}

// typeguard fns
export const isConnected = (msg: ClientMessage): msg is Connected => {
    return (msg as Connected).Connected !== undefined;
};
export const isDisconnected = (msg: ClientMessage): msg is Disconnected => {
    return (msg as Disconnected).Disconnected !== undefined;
};
export const isErrorMessage = (msg: ClientMessage): msg is ErrorMessage => {
    return (msg as ErrorMessage).ErrorMessage !== undefined;
};
export const isNoChannelName = (msg: ErrorType): msg is NoChannelName => {
    return (msg as NoChannelName).NoChannelName !== undefined;
};
export const isChannelNameTooLong = (msg: ErrorType): msg is ChannelNameTooLong => {
    return (msg as ChannelNameTooLong).ChannelNameTooLong !== undefined;
};
export const isChannelNameExists = (msg: ErrorType): msg is ChannelNameExists => {
    return (msg as ChannelNameExists).ChannelNameExists !== undefined;
};
export const isChannelCreated = (msg: ClientMessage): msg is ChannelCreated => {
    return (msg as ChannelCreated).ChannelCreated !== undefined;
};
export const isBrowsemStats = (msg: ClientMessage): msg is BrowsemStats => {
    return (msg as BrowsemStats).BrowsemStats !== undefined;
};
export const isUrlsUpdated = (msg: ClientMessage): msg is UrlsUpdated => {
    return (msg as UrlsUpdated).UrlsUpdated !== undefined;
};
export const isOriginCalls = (msg: ClientMessage): msg is OriginCalls => {
    return (msg as OriginCalls).OriginCalls !== undefined;
};

export const isConnectedToCall = (msg: ClientMessage): msg is ConnectedToCall => {
    return (msg as ConnectedToCall).ConnectedToCall !== undefined;
};
export const isDisconnectedFromCall = (msg: ClientMessage): msg is DisconnectedFromCall => {
    return (msg as DisconnectedFromCall).DisconnectedFromCall !== undefined;
};
export const isAnswerFromServer = (msg: ClientMessage): msg is AnswerFromServer => {
    return (msg as AnswerFromServer).AnswerFromServer !== undefined;
};
export const isOfferFromServer = (msg: ClientMessage): msg is OfferFromServer => {
    return (msg as OfferFromServer).OfferFromServer !== undefined;
};
export const isIceCandidate = (message: any): message is IceCandidate => {
    return (message as IceCandidate).IceCandidate !== undefined;
}
export const isUserUpdatedSettings = (message: any): message is UserUpdatedSettings => {
    return (message as UserUpdatedSettings).UserUpdatedSettings !== undefined;
}

export default function App() {
    const messageListenerExists = useRef(false);
    const browsemStore = useBrowsemStore();
    const settingsStore = useSettingsStore();
    const channelsStore = useChannelsStore();
    const currentCallStore = useCurrentCallStore();

    const handleConnectToServer = () => {
        browsemStore.connect();
    }
    const handleDisconnectFromServer = async () => {
        browsemStore.disconnect();
        browsemStore.setCurrentSelection("Intro");
        await currentCallStore.disconnectedFromCall({DisconnectedFromCall: { reason: "manual disconnect", disconnectedChatter: null }});
    };
    const handleCreateGuestUsername = () => {
        browsemStore.setCurrentSelection("CreatingGuestUsername");
    }
    const messageListener = async (message: BackgroundMessage) => {
        console.log('message on client: ', message);
        // connected by socket, then send update-user-info & update-urls, THEN fetch urls and browsem stats
        // u receive a urlsfetched message
        if (isConnected(message.contents)) {
            browsemStore.connected(message.contents);
            browsemStore.setCurrentSelection("Connected");
            chrome.runtime.sendMessage({
                "type": "update-user-info",
                "contents": JSON.stringify({
                    UpdateInfo: {
                        username: useBrowsemStore.getState().username,
                        settings: settingsStore.settings,
                        // currentUrl: browsemStore.currentUrl,
                        // currentOrigin: new URL(browsemStore.currentUrl).origin,
                        // urlsOpened: browsemStore.urlsOpened,
                        // urlOriginsOpened: browsemStore.urlOriginsOpened,
                    }
                })
            });
            chrome.runtime.sendMessage({
                "type": "update-urls"
            });
        } 
        else if (isUrlsUpdated(message.contents)) {
            chrome.runtime.sendMessage({
                "type": "get-channels-by-origin"
            });
            chrome.runtime.sendMessage({
                "type": "get-browsem-stats"
            });
        }
        else if (isDisconnected(message.contents)) {
            browsemStore.disconnected(message.contents);
           //  await currentCallStore.disconnectedFromCall({DisconnectedFromCall: { reason: message.contents.Disconnected.reason, disconnectedChatter: null }});
        }
        else if (isChannelCreated(message.contents)) {
            let channelCreated = message.contents;
            // find a url of calls, if it exists, set its channels, otherwise push a new urlcalls to the originCalls

            let urlCallFound = useChannelsStore.getState().urlCalls.find(urlCall => urlCall.urlName === channelCreated.ChannelCreated.urlName);
            if (urlCallFound) {
                // edit channels of this url
                let newUrlCalls = useChannelsStore.getState().urlCalls.map(urlCall => {
                    if (urlCall.urlName === channelCreated.ChannelCreated.urlName) {
                        urlCall.channels = channelCreated.ChannelCreated.channels;
                    }
                    return urlCall;
                });
                channelsStore.setUrlCalls(newUrlCalls);
            }
            else {
                let newUrlCalls = [...useChannelsStore.getState().urlCalls, channelCreated.ChannelCreated];
                channelsStore.setUrlCalls(newUrlCalls);
            }
            browsemStore.setCurrentSelection("Connected");
        }
        // error msges
        else if (isErrorMessage(message.contents)) {
            if (isNoChannelName(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...useBrowsemStore.getState().errors, noChannelName: message.contents.ErrorMessage.NoChannelName });
            }
            else if (isChannelNameTooLong(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...useBrowsemStore.getState().errors, channelNameTooLong: message.contents.ErrorMessage.ChannelNameTooLong });
            }
            else if (isChannelNameExists(message.contents.ErrorMessage)) {
                browsemStore.setErrors({ ...useBrowsemStore.getState().errors, channelNameExists: message.contents.ErrorMessage.ChannelNameExists });
            }
        }
        else if (isBrowsemStats(message.contents)) {
            let { sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin } = message.contents.BrowsemStats;
            browsemStore.setBrowsemStats(sessionsOnline, sessionsInYourOrigin, sessionsInYourUrl);
        }
        else if (isOriginCalls(message.contents)) {
            console.log('got origin calls: ', message.contents);
            channelsStore.setUrlCalls(message.contents.OriginCalls.urls);
        }
        else if (isConnectedToCall(message.contents)) {
            let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (activeTab[0].id) {
                currentCallStore.connectedToCall((message.contents as ConnectedToCall), activeTab[0].id);
                console.log('doing a connectedtocall, tabid: ', activeTab[0].id);
            }
        }
        else if (isDisconnectedFromCall(message.contents)) {
            currentCallStore.disconnectedFromCall(message.contents);
        }
        // else if (isOfferFromServer(message.contents)) {
        //     await currentCallStore.handleOfferFromServer(message.contents);
        // }
        // else if (isAnswerFromServer(message.contents)) {
        //     await currentCallStore.handleAnswerFromServer(message.contents);
        //     console.log('HI I GOT AN ANSWER FROM SERVER IT COMPLETED SUCCESSFULLY');
        // }
        // else if (isIceCandidate(message.contents)) {
        //     console.log('its an ice cand: ', message.contents);
        //     await currentCallStore.handleIceCandidateFromServer(message.contents);
        // }
        else if (isUserUpdatedSettings(message.contents)) {
            currentCallStore.handleUserUpdatedSettings(message.contents);
        }
    };

    // handling messages, opens when browsemstore gets username from storage session,
    // which happens when popup is opened.
    useEffect(() => {
        if (messageListenerExists.current === false) {
            chrome.runtime.onMessage.addListener(messageListener)
            messageListenerExists.current = true;
            // get stuff now that message listener is ready and component is mounted
            if (browsemStore.socketState === "Connected") {
                chrome.runtime.sendMessage({
                    "type": "get-browsem-stats",
                });
                // can do origins as well instead in future
                chrome.runtime.sendMessage({
                    "type": "get-channels-by-origin",
                });
            }
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
