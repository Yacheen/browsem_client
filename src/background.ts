import { initPegasusTransport } from '@webext-pegasus/transport/background';
import { browsemStoreBackendReady } from "./hooks/browsemStore";
import { settingsStoreBackendReady} from './hooks/settingsStore';
import { channelsStoreBackendReady} from './hooks/ChannelsStore';
initPegasusTransport();
Promise.all([
    browsemStoreBackendReady(),
    channelsStoreBackendReady(),
    settingsStoreBackendReady(),
]).then(([browsemStore, channelsStore, settingsStore]) => {
    let currentTabId: number | null = null;
    try {
        chrome.storage.session.setAccessLevel({
            accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
        });
    }
    catch (err) {
        console.log('Problem trying to access Storage Session in content script: ', err);
    }
    // let currentActiveTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    // if (currentActiveTab[0].id) {
    //     chrome.scripting.({
    //         target: { tabId: currentActiveTab[0].id },
    //         files: ['./content/main.tsx'],
    //     })
    // }

    chrome.webNavigation.onHistoryStateUpdated.addListener(async thing => {
        chrome.tabs.sendMessage(thing.tabId, {
            type: "url-changed",
            newUrl: thing.url,
        })
    });
    const TEN_SECONDS_MS = 10 * 1000;

    let socket: WebSocket | null = null;
    // ways things cna disconnect
    // client:
    // close socket -> cleanup on clientside, back to continue as guest popup
    //
    // server:
    // receives no heartbeat/socket closes -> cleansup on serverside (removes session from wsserver)


    // Toggle socket connection when they click connect as guest, or they have logged in.
    // For now, shall use, continue as guest after db/http is implemented for new tab.
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === "connect") {
            if (socket === null) {
                connect();
                // keepAlive();
            }
        }
        else if (message.type === "disconnect") {
            disconnect();
        }
        else if (message.type === "update-user-info") {
            socket?.send(message);
        }
        else if (message.type === "update-urls") {
            await sendUpdateUrlsMessage();
        }
        else if (message.type === "create-channel") {
            socket?.send(message);
        }
        else if (message.type === "get-browsem-stats") {
            await getBrowsemStats();
        }
        else if (message.type === "get-channels-by-url") {
            await getChannelsByUrl();
        }
        else if (message.type === "get-channels-by-origin") {
            await getChannelsByOrigin();
        }
        else if (message.type === "connect-to-call") {
            await connectToCall(message.channelName);
        }
        else if (message.type === "get-tab-id") {
            if (sender.tab && sender.tab.id) {
                currentTabId = sender.tab.id;
                sendResponse({ tabId: sender.tab?.id });
            }
        }
        else if (message.type === "ice-candidate") {
            socket?.send(message)
        }
        else if (message.type === "create-offer") {
            socket?.send(message)
        }
        else if (message.type === "answer-from-client") {
            socket?.send(message)
        }
        
        //     socket?.send(JSON.stringify("GetChannelsByUrl"));
        else if (message.type === "join-call") {
            socket?.send(JSON.stringify("JoinCall"));
        }
        else if (message.type === "enable-mic") {
            socket?.send(JSON.stringify("EnableMic"));
        }
        else if (message.type === "enable-camera") {
            socket?.send(JSON.stringify("EnableCamera"));
        }
        else if (message.type === "disconnect-from-call") {
            socket?.send(JSON.stringify("DisconnectFromCall"));
        }
        return true;
    });
    // (tabId, changeInfo, updatedTab)
    chrome.tabs.onUpdated.addListener(async (...stuff) => {
        if (stuff[1].url) {
            await sendUpdateUrlsMessage();
        }
    })
    chrome.tabs.onRemoved.addListener(async () => {
        await sendUpdateUrlsMessage();
    })
    // onclicked is handled on the components within the useEffect after messagelistener
    // is created, rather than here (message listener removed in cleanup fn)
    // chrome.action.onClicked.addListener(() => {
    //     socket?.send(JSON.stringify("GetChannelsByUrl"));
    //     socket?.send(JSON.stringify("GetBrowsemStats"));
    // })
    const connect = () => {
        socket = new WebSocket('http://127.0.0.1:6969/ws');

        socket.onopen = async () => {
            chrome.action.setIcon({ path: '../public/logo.png' });
        }

        socket.onmessage = async (event) => {
            let message: ClientMessage = JSON.parse(event.data);
            if (isConnected(message)) {
                console.log('this is an isconnected message');
                browsemStore.getState().connected(message);
                browsemStore.getState().setCurrentSelection("Connected");
                socket?.send(JSON.stringify({
                        UpdateInfo: {
                            username: browsemStore.getState().username,
                            settings: settingsStore.getState().settings,
                            // currentUrl: browsemStore.currentUrl,
                            // currentOrigin: new URL(browsemStore.currentUrl).origin,
                            // urlsOpened: browsemStore.urlsOpened,
                            // urlOriginsOpened: browsemStore.urlOriginsOpened,
                        }
                }));
                sendUpdateUrlsMessage();
            }
            else if (isUrlsUpdated(message)) {
                getChannelsByOrigin();
                getBrowsemStats();
            }
            else if (isDisconnected(message)) {
                browsemStore.getState().disconnected(message);
            }
            else if (isChannelCreated(message)) {
                let channelCreated = message;
                
                let urlCallFound = channelsStore.getState().urlCalls.find(urlCall => urlCall.urlName === channelCreated.ChannelCreated.urlName);
                if (urlCallFound) {
                    // edit channels of this url
                    let newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => {
                        if (urlCall.urlName === channelCreated.ChannelCreated.urlName) {
                            urlCall.channels = channelCreated.ChannelCreated.channels;
                        }
                        return urlCall;
                    });
                    channelsStore.getState().setUrlCalls(newUrlCalls);
                }
                else {
                    let newUrlCalls = [...channelsStore.getState().urlCalls, channelCreated.ChannelCreated];
                    channelsStore.getState().setUrlCalls(newUrlCalls);
                }
                browsemStore.getState().setCurrentSelection("Connected");
            }
            // error msges
            else if (isErrorMessage(message)) {
                if (isNoChannelName(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, noChannelName: message.ErrorMessage.NoChannelName });
                }
                else if (isChannelNameTooLong(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, channelNameTooLong: message.ErrorMessage.ChannelNameTooLong });
                }
                else if (isChannelNameExists(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, channelNameExists: message.ErrorMessage.ChannelNameExists });
                }
            }
            else if (isBrowsemStats(message)) {
                let { sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin } = message.BrowsemStats;
                browsemStore.getState().setBrowsemStats(sessionsOnline, sessionsInYourOrigin, sessionsInYourUrl);
            }
            else if (isOriginCalls(message)) {
                console.log('got origin calls: ', message);
                channelsStore.getState().setUrlCalls(message.OriginCalls.urls);
            }
            else if (isConnectedToCall(message)) {
                console.log('received isconnected message. (on popup)');
                // add them to the channel they were added to.
                let newUrlCalls = channelsStore.getState().urlCalls;
                let msg: ConnectedToCall = message;
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

                channelsStore.getState().setUrlCalls(newUrlCalls);

                if (chatterChannelHandle) {
                    if (message.ConnectedToCall.connectedChatter.username === browsemStore.getState().username) {
                        // use my current tab id if its me connecting.
                        browsemStore.getState().setChatterChannel(chatterChannelHandle, currentTabId);
                    }
                    else {
                        let yourChatterChannel = browsemStore.getState().chatterChannel;
                        if (yourChatterChannel?.channelName === chatterChannelHandle.channelName) {
                            let newChatterChannel = yourChatterChannel;
                            newChatterChannel?.chatters.push(msg.ConnectedToCall.connectedChatter);
                            browsemStore.getState().setChatterChannel(newChatterChannel, browsemStore.getState().callTabId);
                        }
                    }
                }
            }
            else if (isDisconnectedFromCall(message)) {
                let newUrlCalls = channelsStore.getState().urlCalls;
                let msg: DisconnectedFromCall = message;
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

                channelsStore.getState().setUrlCalls(newUrlCalls);

                if (message.DisconnectedFromCall.disconnectedChatter.username === browsemStore.getState().username) {
                    settingsStore.getState().setSettings({
                        ...settingsStore.getState().settings,
                        cameraIsOn: false,
                        microphoneIsOn: false,
                        sharingScreen: false,
                    });
                    browsemStore.getState().setChatterChannel(null, null);
                }
                else {
                    let chatterChannel = browsemStore.getState().chatterChannel;
                    let newChatterChannel = chatterChannel;
                    if (newChatterChannel) {
                        newChatterChannel.chatters = newChatterChannel.chatters.filter(chatter => chatter.username !== msg.DisconnectedFromCall.disconnectedChatter?.username);
                        browsemStore.getState().setChatterChannel(newChatterChannel, browsemStore.getState().callTabId);
                    }
                }
            }
            // else if (isOfferFromServer(message)) {
            //     await currentCallStore.handleOfferFromServer(message);
            // }
            // else if (isAnswerFromServer(message)) {
            //     await currentCallStore.handleAnswerFromServer(message);
            //     console.log('HI I GOT AN ANSWER FROM SERVER IT COMPLETED SUCCESSFULLY');
            // }
            // else if (isIceCandidate(message)) {
            //     console.log('its an ice cand: ', message);
            //     await currentCallStore.handleIceCandidateFromServer(message);
            // }
            else if (isUserUpdatedSettings(message)) {
                let newUrlCalls = channelsStore.getState().urlCalls;
                let msg: UserUpdatedSettings = message;
                newUrlCalls.map(urlCall => {
                    urlCall.channels.map(channel => {
                        if (channel.sessionId === msg.UserUpdatedSettings.callSessionId) {
                            channel.chatters = channel.chatters.filter(chatter => chatter.username != msg.UserUpdatedSettings.username);
                        }
                        return channel;
                    })
                    return urlCall;
                })
                channelsStore.getState().setUrlCalls(newUrlCalls);

                let chatterChannel = browsemStore.getState().chatterChannel;
                let newChatterChannel = chatterChannel;
                if (newChatterChannel) {
                    newChatterChannel.chatters.map(chatter => {
                        if (chatter.username === msg.UserUpdatedSettings.username)  {
                            chatter.settings = msg.UserUpdatedSettings.settings;
                        }
                        return chatter;
                    })
                    browsemStore.getState().setChatterChannel(newChatterChannel, browsemStore.getState().callTabId);
                }
            }
        }
        socket.onclose = (event) => {
            console.log('onclosed. reason: ', event.reason);
            if (event.reason !== "manual disconnect") {
                socket = null;
                chrome.runtime.sendMessage({
                    "type": "disconnected",
                    "contents": {
                        "Disconnected": {
                            "reason": "non-intentional disconnection"
                        }
                    }
                });
            }
        }
    }
    const disconnect = () => {
        if (socket) {
            socket.close(1000, "manual disconnect");
            socket = null;
        }
    }
    const sendUpdateUrlsMessage = async () => {
        console.log('yeah this works.');
        const tabs = await chrome.tabs.query({ });
        let urls = tabs.map(tab => (tab.url as string));
        let urlOrigins = urls.map(url => new URL((url as string)).origin);
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            let updateUrlsMessage = {
                UpdateUrls: {
                    currentUrl: activeTab[0].url,
                    currentOrigin: new URL(activeTab[0].url).origin,
                    urlsOpened: urls,
                    urlOriginsOpened: urlOrigins,
                }
            };
            socket?.send(JSON.stringify(updateUrlsMessage));
            console.log('yeah this sent..');
        }
    }
    const getBrowsemStats = async () => {
        const tabs = await chrome.tabs.query({ });
        let urls = tabs.map(tab => (tab.url as string));
        let urlOrigins = urls.map(url => new URL((url as string)).origin);
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            let message = {
                GetBrowsemStats: {
                    currentUrl: activeTab[0].url,
                    currentOrigin: new URL(activeTab[0].url).origin,
                }
            };
            socket?.send(JSON.stringify(message));
        }
    }
    const getChannelsByUrl = async () => {
        const tabs = await chrome.tabs.query({ });
        let urls = tabs.map(tab => (tab.url as string));
        let urlOrigins = urls.map(url => new URL((url as string)).origin);
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            let message = {
                GetChannelsByUrl: {
                    currentUrl: activeTab[0].url,
                    currentOrigin: new URL(activeTab[0].url).origin,
                }
            };
            socket?.send(JSON.stringify(message));
        }
    }
    const getChannelsByOrigin = async () => {
        const tabs = await chrome.tabs.query({ });
        let urls = tabs.map(tab => (tab.url as string));
        let urlOrigins = urls.map(url => new URL((url as string)).origin);
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            let message = {
                GetChannelsByOrigin: {
                    currentUrl: activeTab[0].url,
                    currentOrigin: new URL(activeTab[0].url).origin,
                }
            };
            socket?.send(JSON.stringify(message));
        }
    }
    const connectToCall = async (channelName: string) => {
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            socket?.send(JSON.stringify({
                ConnectToCall: {
                    channelName: channelName,
                    urlName: activeTab[0].url,
                }
            }));
        }
    }
    // const keepAlive = () => {
    //     const keepAliveIntervalId = setInterval(() => {
    //         if (socket === null) {
    //             clearInterval(keepAliveIntervalId);
    //         }
    //         else {
    //             socket.send("ping");
    //         }
    //         // less than a 30 second ping interval will make the service worker close I think.
    //     }, TEN_SECONDS_MS);
    //
    // }
});
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
export type IceCandidate = {
    IceCandidate: RTCIceCandidateInit,
}
// types
export type BackgroundMessage = {
    // this type field is used exclusively for sending messages back and forth for
    // the background script and thats it, I think.
    // any different "types" of msgs will be checked with a typeguard in clientmessage
    type: MessageType,
    contents: ClientMessage
}
type MessageType = "offer-from-server" | "answer-from-server";
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
export type Settings = {
    microphoneIsOn: boolean,
    cameraIsOn: boolean,
    sharingScreen: boolean,
    deafened: boolean,
}
export type ChatMessage = {
    chatter: Chatter,
    message: string
};
export type Chatter = {
    username: string,
    sessionId: string,
    pfpS3Key?: string,
    settings: Settings,
}
export type ChatterChannel = {
    sessionId: string,
    channelName: string,
    channelOwner: string,
    chatters: Chatter[],
    urlOrigin: string,
    fullUrl: string,
    maxChatters: number,
    channelMessages: ChatMessage[],
};
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
        connectedChatter: Chatter,
        channelName: string ,
        channelSessionId: string,
        urlName: string,
    }
}
export type DisconnectedFromCall = {
    DisconnectedFromCall: {
        disconnectedChatter: Chatter,
        channelName: string,
        urlName: string,
        reason: string,
        // joiningAnotherCall
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

