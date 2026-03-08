import { useBrowsemStore } from '@/hooks/browsemStore';
import './CallSidebar.scss';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName } from '@/utils/functions';
import Channels from './Channels';
import Chatroom from './Chatroom';
import CallButtons from './CallButtons';
import { useSettingsStore } from '@/hooks/settingsStore';
import { useState } from 'react';
import pfpPath from "../assets/chatter_default_pfp.png";
const defaultPfp = chrome.runtime.getURL(pfpPath);

function CallSidebar() {
    const browsemStore = useBrowsemStore();
    const callUrl = useBrowsemStore(state => state.chatterChannel?.fullUrl);
    const currentCall = useCurrentCallStore();
    const channelsStore = useChannelsStore();
    const settings = useSettingsStore(state => state.settings);
    const urlCalls = useChannelsStore(state => state.urlCalls)
    const chatterChannel = useBrowsemStore(state => state.chatterChannel);
    const [currentUrlDropdown, setCurrentUrlDropdown] = useState<string[]>([]);
    return (
        <div className="call-sidebar">
            {
                urlCalls.filter(urlCall => getDomainName(urlCall.urlName) === getDomainName(chatterChannel?.fullUrl ?? "")).map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) === 1
                ?
                    <p id="channels-on-origin" className="channels-on-origin">{urlCalls.filter(urlCall => getDomainName(urlCall.urlName) === getDomainName(chatterChannel?.fullUrl ?? "")).map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channel on {getDomainName(browsemStore.currentUrl)}</p>
                :
                    <p id="channels-on-origin" className="channels-on-origin">{urlCalls.filter(urlCall => getDomainName(urlCall.urlName) === getDomainName(chatterChannel?.fullUrl ?? "")).map(urlCall => urlCall.channels.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0) } channels on {getDomainName(chatterChannel?.fullUrl ?? "")}</p>
            }
            <p id="calls-header" className="calls-header">Calls</p>
            <Channels  urlForRenderingDomains={callUrl} currentUrlDropdown={currentUrlDropdown} setCurrentUrlDropdown={setCurrentUrlDropdown} />
            <p id="chat-header" className="chat-header">Chat</p>
            <Chatroom />
            <CallButtons chatter={{
                username: browsemStore.username,
                sessionId: browsemStore.sessionId ?? "",
                settings: settings,
                pfpS3Key: defaultPfp,
            }} />
        </div>
    )
}

export default CallSidebar;
