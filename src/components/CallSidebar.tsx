import { useBrowsemStore } from '@/hooks/browsemStore';
import './CallSidebar.scss';
import { useCurrentCallStore } from '@/hooks/callStore';

function CallSidebar() {
    const browsemStore = useBrowsemStore();
    const currentCall = useCurrentCallStore();
    return (
        <div className="call-sidebar">
            <p>{browsemStore.currentUrl} channels on {}</p>

        </div>
    )
}

export default CallSidebar;
