import { initPegasusTransport } from '@webext-pegasus/transport/background';
import { browsemStoreBackendReady, useBrowsemStore } from "./hooks/browsemStore";
import { settingsStoreBackendReady} from './hooks/settingsStore';
import { channelsStoreBackendReady} from './hooks/ChannelsStore';
import { isConnected, isOriginCalls, isUrlsUpdated, isBrowsemStats, isDisconnected, isErrorMessage, isIceCandidate, isNoChannelName, isChannelCreated, isConnectedToCall, isOfferFromServer, isAnswerFromServer, isChannelNameExists,
    isChannelNameTooLong, isUserUpdatedSettings, isDisconnectedFromCall, Chatter, Settings, UrlCalls, Connected, ErrorType, ChatMessage, MessageType, OriginCalls, UrlsUpdated, BrowsemStats, Disconnected, 
    ErrorMessage, IceCandidate, ClientMessage, NoChannelName, ChannelCreated, ChatterChannel, ConnectedToCall, OfferFromClient, OfferFromServer, AnswerFromClient, AnswerFromServer, BackgroundMessage, ChannelNameExists,
    ChannelNameTooLong, UserUpdatedSettings, DisconnectedFromCall, 
} from "./utils/types.ts";

initPegasusTransport();

Promise.all([
    browsemStoreBackendReady(),
    channelsStoreBackendReady(),
    settingsStoreBackendReady(),
]).then(([browsemStore, channelsStore, settingsStore]) => {
    try {
        chrome.storage.session.setAccessLevel({
            accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
        });
    }
    catch (err) {
        console.log('Problem trying to access Storage Session in content script: ', err);
    }
    const TEN_SECONDS_MS = 10 * 1000;

    let socket: WebSocket | null = null;

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === "connect") {
            if (socket === null) {
                connect();
            }
        }
        else if (message.type === "disconnect") {
            disconnect();
        }
        else if (message.type === "update-user-info") {
            socket?.send(message.contents);
        }
        else if (message.type === "update-urls") {
            await sendUpdateUrlsMessage();
        }
        else if (message.type === "create-channel") {
            socket?.send(message.contents);
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
        else if (message.type === "get-channels-by-origins") {
            socket?.send(JSON.stringify("GetChannelsByOrigins"));
        }
        else if (message.type === "connect-to-call") {
            await connectToCall(message.channelName);
        }
        else if (message.type === "get-tab-id") {
            if (sender.tab?.id) {
                sendResponse({ tabId: sender.tab.id });
            }
        }
        else if (message.type === "ice-candidate") {
            socket?.send(message.contents)
        }
        else if (message.type === "create-offer") {
            socket?.send(message.contents)
        }
        else if (message.type === "answer-from-client") {
            socket?.send(message.contents);
        }
        //  probably handle reconnection of peer stuff
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
            console.log('got message: ', message);
            if (isConnected(message)) {
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
                getChannelsByOrigins();
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
                    // let newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => {
                    //     if (urlCall.urlName === channelCreated.ChannelCreated.urlName) {
                    //         urlCall.channels = channelCreated.ChannelCreated.channels;
                    //     }
                    //     return urlCall;
                    // });
                    const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall =>
                        urlCall.urlName === channelCreated.ChannelCreated.urlName
                        ? { ...urlCall, channels: channelCreated.ChannelCreated.channels }
                        : urlCall
                    );
                    channelsStore.getState().setUrlCalls(newUrlCalls);
                }
                else {
                    channelsStore.getState().setUrlCalls([
                        ...channelsStore.getState().urlCalls,
                        channelCreated.ChannelCreated,
                    ]);
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
                channelsStore.getState().setUrlCalls(message.OriginCalls.urls);
            }
            else if (isConnectedToCall(message)) {
                let msg: ConnectedToCall = message;
                let chatterChannelHandle: ChatterChannel | undefined;

                // const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => {
                //     if (urlCall.urlName !== msg.ConnectedToCall.urlName) return urlCall;
                //     return {
                //         ...urlCall,
                //         channels: urlCall.channels.map(channel => {
                //             if (channel.channelName !== msg.ConnectedToCall.channelName) return channel;
                //
                //             const updatedChannel = {
                //                 ...channel,
                //                 chatters: [...channel.chatters, msg.ConnectedToCall.connectedChatter],
                //             };
                //             chatterChannelHandle = updatedChannel;
                //             return updatedChannel;
                //         }),
                //     };
                // });
                //
                // channelsStore.getState().setUrlCalls(newUrlCalls);

                channelsStore.getState().setUrlCallsWithPrevState(prev => prev.map(urlCall => {
                if (urlCall.urlName !== msg.ConnectedToCall.urlName) return urlCall;
                    return {
                        ...urlCall,
                        channels: urlCall.channels.map(channel => {
                            if (channel.channelName !== msg.ConnectedToCall.channelName) return channel;
                            const updatedChannel = {
                                ...channel,
                                chatters: [...channel.chatters, msg.ConnectedToCall.connectedChatter],
                            };
                            chatterChannelHandle = updatedChannel;
                            return updatedChannel;
                        }),
                    };
                }));

                if (chatterChannelHandle) {
                    if (msg.ConnectedToCall.connectedChatter.username === browsemStore.getState().username) {
                        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                        if (activeTab[0].id) {
                            browsemStore.getState().setChatterChannel(chatterChannelHandle, activeTab[0].id);
                        }
                    }
                    else {
                        const yourChatterChannel = browsemStore.getState().chatterChannel;
                        if (yourChatterChannel?.channelName === chatterChannelHandle.channelName) {
                            browsemStore.getState().setChatterChannel({
                                ...yourChatterChannel,
                                chatters: [...yourChatterChannel.chatters, msg.ConnectedToCall.connectedChatter],
                            }, browsemStore.getState().callTabId);
                        }
                    }
                }
            }
            else if (isDisconnectedFromCall(message)) {
                let msg: DisconnectedFromCall = message;
                // const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => {
                //     if (urlCall.urlName !== msg.DisconnectedFromCall.urlName) return urlCall;
                //     return {
                //         ...urlCall,
                //         channels: urlCall.channels.map(channel => {
                //             if (channel.channelName !== msg.DisconnectedFromCall.channelName) return channel;
                //             console.log('the channelName and urlName is the same, filtering...');
                //             return {
                //                 ...channel,
                //                 chatters: channel.chatters.filter(chatter => chatter.username !== msg.DisconnectedFromCall.disconnectedChatter.username),
                //             };
                //         }),
                //     };
                // });
                //
                // channelsStore.getState().setUrlCalls(newUrlCalls);

                channelsStore.getState().setUrlCallsWithPrevState(prev => prev.map(urlCall => {
                    if (urlCall.urlName !== msg.DisconnectedFromCall.urlName) return urlCall;
                    return {
                        ...urlCall,
                        channels: urlCall.channels.map(channel => {
                            if (channel.channelName !== msg.DisconnectedFromCall.channelName) return channel;
                            console.log('the channelName and urlName is the same, filtering...');
                            return {
                                ...channel,
                                chatters: channel.chatters.filter(chatter => chatter.username !== msg.DisconnectedFromCall.disconnectedChatter.username),
                            };
                        }),
                    };
                }));



                if (msg.DisconnectedFromCall.disconnectedChatter.username === browsemStore.getState().username) {
                    console.log('YOU ARE THE ONE THAT DISCONNECTED GET DOWN!!!!!!!!!!!!');
                    settingsStore.getState().setSettings({
                        ...settingsStore.getState().settings,
                        cameraIsOn: false,
                        microphoneIsOn: false,
                        sharingScreen: false,
                    });
                    const callTabId = browsemStore.getState().callTabId;
                    if (callTabId) {
                        chrome.tabs.sendMessage(callTabId, {
                            type: "disconnected-from-call",
                            contents: message
                        });
                    }
                    if (msg.DisconnectedFromCall.reason !== 'joining another call') {
                        browsemStore.getState().setChatterChannel(null, null);
                    }
                }
                else {
                    console.log('they are the one that disconnected----------');
                    const chatterChannel = browsemStore.getState().chatterChannel;
                    if (chatterChannel) {
                        browsemStore.getState().setChatterChannel({
                            ...chatterChannel,
                            chatters: chatterChannel.chatters.filter(chatter => chatter.username !== msg.DisconnectedFromCall.disconnectedChatter.username),
                        }, browsemStore.getState().callTabId);
                    }
                }
            }
            else if (isOfferFromServer(message)) {
                let callTabId = useBrowsemStore.getState().callTabId;
                if (callTabId) {
                    chrome.tabs.sendMessage(callTabId, {
                        type: "offer-from-server",
                        contents: message
                    });
                }
            }
            else if (isAnswerFromServer(message)) {
                let callTabId = useBrowsemStore.getState().callTabId;
                if (callTabId) {
                    chrome.tabs.sendMessage(callTabId, {
                        type: "answer-from-server",
                        contents: message
                    });
                }
            }
            else if (isIceCandidate(message)) {
                let callTabId = useBrowsemStore.getState().callTabId;
                if (callTabId) {
                    chrome.tabs.sendMessage(callTabId, {
                        type: "ice-candidate",
                        contents: message
                    });
                }
            }
            else if (isUserUpdatedSettings(message)) {
                // let newUrlCalls = channelsStore.getState().urlCalls;
                // let msg: UserUpdatedSettings = message;
                // newUrlCalls.map(urlCall => {
                //     urlCall.channels.map(channel => {
                //         if (channel.sessionId === msg.UserUpdatedSettings.callSessionId) {
                //             channel.chatters = channel.chatters.filter(chatter => chatter.username != msg.UserUpdatedSettings.username);
                //         }
                //         return channel;
                //     })
                //     return urlCall;
                // })
                // channelsStore.getState().setUrlCalls(newUrlCalls);
                //
                // let chatterChannel = browsemStore.getState().chatterChannel;
                // let newChatterChannel = chatterChannel;
                // if (newChatterChannel) {
                //     newChatterChannel.chatters.map(chatter => {
                //         if (chatter.username === msg.UserUpdatedSettings.username)  {
                //             chatter.settings = msg.UserUpdatedSettings.settings;
                //         }
                //         return chatter;
                //     })
                //     browsemStore.getState().setChatterChannel(newChatterChannel, browsemStore.getState().callTabId);
                // }
                    let msg: UserUpdatedSettings = message;
                    const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => ({
                        ...urlCall,
                        channels: urlCall.channels.map(channel => {
                            if (channel.sessionId !== msg.UserUpdatedSettings.callSessionId) return channel;
                            return {
                                ...channel,
                                chatters: channel.chatters.map(chatter =>
                                    chatter.username === msg.UserUpdatedSettings.username
                                        ? { ...chatter, settings: msg.UserUpdatedSettings.settings }
                                        : chatter
                                ),
                            };
                        }),
                    }));
                    channelsStore.getState().setUrlCalls(newUrlCalls);

                    const chatterChannel = browsemStore.getState().chatterChannel;
                    if (chatterChannel) {
                        browsemStore.getState().setChatterChannel({
                            ...chatterChannel,
                            chatters: chatterChannel.chatters.map(chatter =>
                                chatter.username === msg.UserUpdatedSettings.username
                                    ? { ...chatter, settings: msg.UserUpdatedSettings.settings }
                                    : chatter
                            ),
                        }, browsemStore.getState().callTabId);
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
    const getChannelsByOrigins = async () => {
        // const tabs = await chrome.tabs.query({ });
        // let urls = tabs.map(tab => (tab.url as string));
        // let urlOrigins = urls.map(url => new URL((url as string)).origin);
        // let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        // if (activeTab[0].url) {
            // let message = {
            //     GetChannelsByOrigins: {
            //         // currentUrl: activeTab[0].url,
            //         currentOrigin: new URL(activeTab[0].url).origin,
            //     }
            // };
        // }
        socket?.send(JSON.stringify("GetChannelsByOrigins"));
    }
    const getChannelsByOrigin = async () => {
        const tabs = await chrome.tabs.query({ });
        let urls = tabs.map(tab => (tab.url as string));
        let urlOrigins = urls.map(url => new URL((url as string)).origin);
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            let message = {
                GetChannelsByOrigins: {
                    // currentUrl: activeTab[0].url,
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


