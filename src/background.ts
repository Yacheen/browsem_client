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
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "connect") {
        if (socket === null) {
            connect();
            // keepAlive();
        }
    }
    else if (message.type === "disconnect") {
        disconnect();
    }
    else if (message.type === "update-profile") {
        socket?.send(message.contents);
    }
});
const connect = () => {
    socket = new WebSocket('http://127.0.0.1:6969/ws');

    socket.onopen = () => {
        chrome.action.setIcon({ path: '../public/logo.png' });
    }

    socket.onmessage = (event) => {
        let message = JSON.parse(event.data);
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
// }
