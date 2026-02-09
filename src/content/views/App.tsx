import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useCurrentCallStore } from '@/hooks/callStore';

export default function App() {
    const browsemStore = useBrowsemStore();
    const currentCallStore = useCurrentCallStore();
    const handleCloseCurrentCall = () => {
    }
    return (
        currentCallStore.chatterChannel
        ?
            <WindowHandler minWidth={480} minHeight={46} type='BrowsemCall' description={browsemStore.currentUrl} closeMyWindow={handleCloseCurrentCall}>
                <BrowsemCall />
            </WindowHandler>
        :
            null
    )
}

