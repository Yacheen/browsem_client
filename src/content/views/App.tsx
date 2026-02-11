import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useEffect } from 'react';

export default function App() {
    const browsemStore = useBrowsemStore();
    const currentCallStore = useCurrentCallStore();
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "session") {
            if (changes['current-call-session-storage']) {
                useCurrentCallStore.persist.rehydrate();
            }
            else if (changes['browsem-session-storage']) {
                useBrowsemStore.persist.rehydrate();
            }
        }
    });
    const handleCloseCurrentCall = () => {
    }
    useEffect(() => {
        currentCallStore
    }, [currentCallStore]);
    return (
        chatterChannel
        ?
            <WindowHandler minWidth={480} minHeight={46} type='BrowsemCall' description={browsemStore.currentUrl} closeMyWindow={handleCloseCurrentCall}>
                <BrowsemCall />
            </WindowHandler>
        :
            null
    )
}

