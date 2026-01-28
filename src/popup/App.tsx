import HelloWorld from '@/components/HelloWorld'
import './App.css'
import { useEffect, useState } from 'react'
import { useBrowsemStore } from '@/hooks/browsemStore';

type BackgroundMessage = {
    // this type field is used exclusively for 
    type: MessageType,
    contents: ClientMessage
}

type ClientMessage = Disconnected | Connected;

type Disconnected = {
    Disconnected: {
        reason: string
    }
};

type Connected = {
    Connected: {
        sessionId: string,
        onlineSessions: number
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
    const browsemStore = useBrowsemStore();

    const handleConnectToServer = () => {
        if (browsemStore.socketState === 'Disconnected') {
            browsemStore.connect();
        }
        else if (browsemStore.socketState === 'Connected') {
            browsemStore.disconnect();
        }
    }
    
    useEffect(() => {
        console.log(window.location);
    }, [window.location.href]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(async (message: BackgroundMessage) => {
            console.log('new background msg: ', message);
            if (isConnected(message.contents)) {
                browsemStore.connected();
            } 
            else if (isDisconnected(message.contents)) {
                browsemStore.disconnected();
            }
        });
    }, [])

  return (
    <div>
        <h1>Browsem</h1>
        {
            browsemStore.socketState === 'Connected'
            ?
                <>
                    <h1> connected to server can see lots of stuff now. </h1>
                    <button onClick={handleConnectToServer}> disconnect </button>
                </>
            :
                <HelloWorld msg="Vite + React + CRXJS" handleConnectToServer={handleConnectToServer} />
        }
    </div>
  )
}
