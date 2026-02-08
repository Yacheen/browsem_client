import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import { useBrowsemStore } from '@/hooks/browsemStore';

export default function App() {
    const browsemStore = useBrowsemStore();
    return (
        <WindowHandler minWidth={480} minHeight={46} type='BrowsemCall' description={browsemStore.currentUrl} closeMyWindow={() => console.log('hi')}>
            <BrowsemCall />
        </WindowHandler>
    )
}

