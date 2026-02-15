import { useBrowsemStore } from '@/hooks/browsemStore';
import './CallSidebar.scss';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName } from '@/utils/functions';
import Channels from './Channels';
import Chatroom from './Chatroom';
import CallButtons from './CallButtons';
import aniviaUltAsset from "../assets/aniviault.png";
import { useSettingsStore } from '@/hooks/settingsStore';
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

function CallSidebar() {
    const browsemStore = useBrowsemStore();
    const currentCall = useCurrentCallStore();
    const channelsStore = useChannelsStore();
    const settings = useSettingsStore(state => state.settings);
    return (
        <div className="call-sidebar">
            {
                useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) === 1
                ?
                    <p className="channels-on-origin">{useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channel on {getDomainName(browsemStore.currentUrl)}</p>
                :
                    <p className="channels-on-origin">{useChannelsStore.getState().urlCalls.map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channels on {getDomainName(browsemStore.currentUrl)}</p>
            }
            <p className="calls-header">Calls</p>
            <Channels />
            <Chatroom />
            <CallButtons chatter={{
                username: browsemStore.username,
                sessionId: browsemStore.sessionId ?? "",
                settings: settings,
                pfpS3Key: aniviaUlt,
            }} />
        </div>
    )
}

export default CallSidebar;
