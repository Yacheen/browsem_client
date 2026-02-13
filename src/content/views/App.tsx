import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useEffect, useState } from 'react';
import { ChatterChannel } from '@/components/Channels';
import { useChannelsStore } from '@/hooks/ChannelsStore';

export default function App() {
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel)
    const callTabId = useCurrentCallStore(state => state.tabId);
    const [currentTabId, setCurrentTabId] = useState(null);
    const handleStorageChange = (changes: {[key: string]: chrome.storage.StorageChange}, areaName: string) => {
        if (areaName === "session") {
            if (changes['current-call-session-storage']) {
                console.log(changes);
                useCurrentCallStore.persist.rehydrate();
                console.log('hi');
            }
            else if (changes['browsem-session-storage']) {
                useBrowsemStore.persist.rehydrate();
                console.log('hi');
            }
            else if (changes['channel-session-storage']) {
                useChannelsStore.persist.rehydrate();
                console.log('hi');
            }
        }
    }
    useEffect(() => {
        chrome.storage.onChanged.addListener(handleStorageChange);
        // chrome.runtime.onMessage.addListener(handleRuntimeMessage);
        chrome.runtime.sendMessage({ type: "get-tab-id"}, response => {
            if (response && response.tabId) {
                console.log('SETTING THE CURRENT TABBBBBBBBBB');
                setCurrentTabId(response.tabId);
            }
        });
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        }
    }, []);
    const handleCloseCurrentCall = () => {
    }
    return (
        useCurrentCallStore.getState().tabId === currentTabId 
        ?
            <WindowHandler minWidth={480} minHeight={46} type='BrowsemCall' description={chatterChannel?.fullUrl} closeMyWindow={handleCloseCurrentCall}>
                <BrowsemCall />
            </WindowHandler>
        :
            null
    )
}

