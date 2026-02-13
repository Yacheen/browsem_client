import { useBrowsemStore } from '@/hooks/browsemStore';
import './CallSidebar.scss';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName } from '@/utils/functions';
import Channels from './Channels';
import Chatroom from './Chatroom';

function CallSidebar() {
    const browsemStore = useBrowsemStore();
    const currentCall = useCurrentCallStore();
    const channelsStore = useChannelsStore();
    return (
        <div className="call-sidebar">
            {
                useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) === 1
                ?
                    <p className="channels-on-youtube">{useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channel on {getDomainName(browsemStore.currentUrl)}</p>
                :
                    <p className="channels-on-youtube">{useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channels on {getDomainName(browsemStore.currentUrl)}</p>
            }

            <p className="calls-header">Calls</p>
            <Channels />
            <Chatroom />
        </div>
    )
}

export default CallSidebar;
