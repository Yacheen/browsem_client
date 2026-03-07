import { initPegasusTransport } from '@webext-pegasus/transport/background';
import { browsemStoreBackendReady, useBrowsemStore } from "./hooks/browsemStore";
import { settingsStoreBackendReady} from './hooks/settingsStore';
import { channelsStoreBackendReady, useChannelsStore} from './hooks/ChannelsStore';
import { isConnected, isOriginCalls, isUrlsUpdated, isBrowsemStats, isDisconnected, isErrorMessage, isIceCandidate, isNoChannelName, isChannelCreated, isConnectedToCall, isOfferFromServer, isAnswerFromServer, isChannelNameExists,
    isChannelNameTooLong, isUserUpdatedSettings, isDisconnectedFromCall, Chatter, Settings, UrlCalls, Connected, ErrorType, ChannelMessage, MessageType, OriginCalls, UrlsUpdated, BrowsemStats, Disconnected, 
    ErrorMessage, IceCandidate, ClientMessage, NoChannelName, ChannelCreated, ChatterChannel, ConnectedToCall, OfferFromClient, OfferFromServer, AnswerFromClient, AnswerFromServer, BackgroundMessage, ChannelNameExists,
    ChannelNameTooLong, UserUpdatedSettings, DisconnectedFromCall,
    isReconnectedToCall,
    ReconnectedToCall,
    isChannelMessageSent,
    ChannelMessageSent, 
} from "./utils/types.ts";
import { snackbarStoreBackendReady } from './hooks/snackbarStore.tsx';
import { AlertColor } from '@mui/material';
import { volumeStoreBackendReady } from './hooks/volumeStore.tsx';

// ripped lines 17-29 from chrome offscreen docs
let creating: any; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Audio SFX',
    });
    await creating;
    creating = null;
  }
  // for some reason its not actually ready after being awaited so i put this in here.
  await new Promise(resolve => setTimeout(resolve, 100));
}

initPegasusTransport();

Promise.all([
    browsemStoreBackendReady(),
    channelsStoreBackendReady(),
    settingsStoreBackendReady(),
    snackbarStoreBackendReady(),
    volumeStoreBackendReady(),
]).then(([browsemStore, channelsStore, settingsStore, snackbarStore, volumeStore]) => {
    volumeStore.subscribe(async state => {
        await setupOffscreenDocument("offscreen.html");
        console.log('new state: ', state);
        chrome.runtime.sendMessage({
            type: 'offscreen',
            action: 'change-volume',
            newVolume: state.volume
        });
    });
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
        console.log('message on bg script received: ', message);
        if (message.type === "connect") {
            if (socket === null) {
                if (message.username.length > 30) {
                    snackbarStore.getState().setSnackbar(true, "Username exceeds 30 characters", "warning");
                    await setupOffscreenDocument("offscreen.html");
                    await chrome.runtime.sendMessage({
                        type: "offscreen",
                        action: "play",
                        path: "src/assets/sounds/chat_error_msg_sound.wav",
                    });
                }
                else if (message.username.length === 0) {
                    snackbarStore.getState().setSnackbar(true, "Username must be at least 1 character", "warning");
                    await setupOffscreenDocument("offscreen.html");
                    await chrome.runtime.sendMessage({
                        type: "offscreen",
                        action: "play",
                        path: "src/assets/sounds/chat_error_msg_sound.wav",
                    });
                }
                else {
                    // request. if response returns exists or catches an err, dont do connect();
                    try {
                        const response = await fetch("http://127.0.0.1:6969/checkUsernameExists", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                username: message.username
                            }),
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.exists) {
                                snackbarStore.getState().setSnackbar(true, `Someone is online with that username`, "info");
                            }
                            else {
                                connect();
                            }
                        }
                        else {
                            snackbarStore.getState().setSnackbar(true, `Internal server error. Please try again later.`, "error");
                        }
                    }
                    catch (err) {
                        snackbarStore.getState().setSnackbar(true, `Internal server error: ${err}`, "error");
                    }
                }
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
            await connectToCall(message.channelName, message.urlName);
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
        else if (message.type === "enable-mic") {
            socket?.send(JSON.stringify("EnableMic"));
        }
        else if (message.type === "enable-camera") {
            socket?.send(JSON.stringify("EnableCamera"));
        }
        else if (message.type === "disconnect-from-call") {
            socket?.send(JSON.stringify("DisconnectFromCall"));
        }
        else if (message.type === "reconnect-to-call") {
            await reconnectToCall();
        }
        else if (message.type === "send-channel-message") {
            socket?.send(JSON.stringify(message.contents));
        }
        else if (message.type === "play-sound") {
            await setupOffscreenDocument("offscreen.html");
            await chrome.runtime.sendMessage({
                type: "offscreen",
                action: "play",
                path: message.path,
            });
        }
        else if (message.type === "console-log") {
            console.log(message.logs);
        }
        return true;
    });
    // (tabId, changeInfo, updatedTab)
    chrome.tabs.onUpdated.addListener(async (...stuff) => {
        if (stuff[1].url) {
            await sendUpdateUrlsMessage();
        }
    })
    chrome.tabs.onRemoved.addListener(async (tabId) => {
        if (tabId === browsemStore.getState().callTabId) {
            // u closed the tab that was of the call, send a disconnectfromcall msg
            socket?.send(JSON.stringify("DisconnectFromCall"));
        }
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
                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/notification_sound.wav",
                });
            }
            else if (isUrlsUpdated(message)) {
                getChannelsByOrigins();
                getBrowsemStats();
            }
            else if (isDisconnected(message)) {
                browsemStore.getState().disconnected(message);
                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/screenshare_stopped_sound.wav",
                });
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

                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/click_sound.wav",
                });
            }
            // error msges
            else if (isErrorMessage(message)) {
                let severity: AlertColor = "info";
                let msg = "Unknown Error...";
                if (isNoChannelName(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, noChannelName: message.ErrorMessage.NoChannelName });
                    severity = "warning";
                    msg = message.ErrorMessage.NoChannelName;
                }
                else if (isChannelNameTooLong(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, channelNameTooLong: message.ErrorMessage.ChannelNameTooLong });
                    severity = "warning";
                    msg = message.ErrorMessage.ChannelNameTooLong;
                }
                else if (isChannelNameExists(message.ErrorMessage)) {
                    browsemStore.getState().setErrors({ ...browsemStore.getState().errors, channelNameExists: message.ErrorMessage.ChannelNameExists });
                    severity = "warning";
                    msg = message.ErrorMessage.ChannelNameExists;
                }
                // active, message, type
                snackbarStore.getState().setSnackbar(true, msg, severity);
                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/chat_error_msg_sound.wav",
                });
            }
            else if (isBrowsemStats(message)) {
                let { sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin } = message.BrowsemStats;
                browsemStore.getState().setBrowsemStats(sessionsOnline, sessionsInYourUrl, sessionsInYourOrigin);
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
                        await setupOffscreenDocument("offscreen.html");
                        await chrome.runtime.sendMessage({
                            type: "offscreen",
                            action: "play",
                            path: "src/assets/sounds/joined_call_sound.wav",
                        });
                        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                        if (activeTab[0].id) {
                            browsemStore.getState().setChatterChannel(chatterChannelHandle, activeTab[0].id);
                            browsemStore.getState().setPendingReconnectionFromRefresh(null);
                        }
                    }
                    else { 
                        const yourChatterChannel = browsemStore.getState().chatterChannel;
                        if (yourChatterChannel?.channelName === chatterChannelHandle.channelName) {
                            await setupOffscreenDocument("offscreen.html");
                            await chrome.runtime.sendMessage({
                                type: "offscreen",
                                action: "play",
                                path: "src/assets/sounds/joined_call_sound.wav",
                            });
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
                            return {
                                ...channel,
                                chatters: channel.chatters.filter(chatter => chatter.username !== msg.DisconnectedFromCall.disconnectedChatter.username),
                            };
                        }),
                    };
                }));



                if (msg.DisconnectedFromCall.disconnectedChatter.username === browsemStore.getState().username) {
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
                    browsemStore.getState().setPendingReconnectionFromRefresh(null);
                    await setupOffscreenDocument("offscreen.html");
                    await chrome.runtime.sendMessage({
                        type: "offscreen",
                        action: "play",
                        path: "src/assets/sounds/joined_call_sound.wav",
                    });
                }
                else {
                    console.log('they are the one that disconnected----------');
                    const chatterChannel = browsemStore.getState().chatterChannel;
                    if (chatterChannel) {
                        if (message.DisconnectedFromCall.channelName === chatterChannel.channelName) {
                            await setupOffscreenDocument("offscreen.html");
                            await chrome.runtime.sendMessage({
                                type: "offscreen",
                                action: "play",
                                path: "src/assets/sounds/joined_call_sound.wav",
                            });
                        }
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
            // set new channel in channelsstore, and browsemstores chatterchannel
            else if (isReconnectedToCall(message)) {
                // set chatterchannel only
                let msg: ReconnectedToCall = message;
                const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => ({
                    ...urlCall,
                    channels: urlCall.channels.map(channel => {
                        if (channel.sessionId !== msg.ReconnectedToCall.channelSessionId) return channel;
                        return {
                            ...msg.ReconnectedToCall.chatterChannel
                        };
                    }),
                }));
                channelsStore.getState().setUrlCalls(newUrlCalls);

                browsemStore.getState().setChatterChannel(msg.ReconnectedToCall.chatterChannel, browsemStore.getState().callTabId);
                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/joined_call_sound.wav",
                });
            }
            else if (isChannelMessageSent(message)) {
                // set the chatterchannel, and channelsstore chatmessage.
                let msg: ChannelMessageSent = message;
                const newUrlCalls = channelsStore.getState().urlCalls.map(urlCall => ({
                    ...urlCall,
                    channels: urlCall.channels.map(channel => {
                        if (channel.sessionId !== msg.ChannelMessageSent.channelSessionId) return channel;
                        return {
                            ...channel,                         
                            channelMessages: [...channel.channelMessages, msg.ChannelMessageSent.message]
                        };
                    }),
                }));
                
                channelsStore.getState().setUrlCalls(newUrlCalls);

                const chatterChannel = browsemStore.getState().chatterChannel;
                if (chatterChannel && chatterChannel.sessionId === msg.ChannelMessageSent.channelSessionId) {
                    await setupOffscreenDocument("offscreen.html");
                    await chrome.runtime.sendMessage({
                        type: "offscreen",
                        action: "play",
                        path: "src/assets/sounds/chat_general_msg_sound.wav",
                    });
                    browsemStore.getState().setChatterChannel({
                        ...chatterChannel,
                        channelMessages: [...browsemStore.getState().chatterChannel!.channelMessages, msg.ChannelMessageSent.message],
                    },
                    browsemStore.getState().callTabId);
                }

                // const newChatterChannel = channelsStore.getState().urlCalls.map(urlCall => ({
                //     ...urlCall,
                //     channels: urlCall.channels.map(channel => {
                //         if (channel.sessionId !== msg.ChannelMessageSent.channelSessionId) return channel;
                //         return {
                //             ...channel,                         
                //             channelMessages: [...channel.channelMessages, msg.ChannelMessageSent.message]
                //         };
                //     }),
                // }));
            }
        }
        socket.onclose = async (event) => {
            if (event.reason !== "manual disconnect") {
                socket = null;
                await setupOffscreenDocument("offscreen.html");
                await chrome.runtime.sendMessage({
                    type: "offscreen",
                    action: "play",
                    path: "src/assets/sounds/screenshare_stopped_sound.wav",
                });
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
    const connectToCall = async (channelName: string, urlName: string) => {
        socket?.send(JSON.stringify({
            ConnectToCall: {
                channelName: channelName,
                urlName: urlName,
            }
        }));
    }
    const reconnectToCall = async () => {
        let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        if (activeTab[0].url) {
            socket?.send(JSON.stringify("ReconnectToCall"));
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


