import { BackgroundMessage, ClientMessage, isConnected, isUrlsUpdated } from "./popup/App";
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
    else if (message.type === "connect-to-call") {
        await connectToCall(message.channelName);
    }
    else if (message.type === "get-tab-id") {
        console.log('got a get-tab-id: ', sender.tab?.id);
        sendResponse({ tabId: sender.tab?.id });
    }
    else if (message.type === "ice-candidate") {
        socket?.send(message.contents)
    }
    else if (message.type === "create-offer") {
        socket?.send(message.contents)
    }
    else if (message.type === "answer-from-client") {
        socket?.send(message.contents)
    }
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

    socket.onmessage = (event) => {
        let message: ClientMessage = JSON.parse(event.data);
        // if (isConnected(message)) {
        //     await sendUpdateUrlsMessage();
        // }
        chrome.runtime.sendMessage({
            "type": "message",
            "contents": message,
        });
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
