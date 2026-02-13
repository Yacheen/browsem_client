// import { useBrowsemStore } from '@/hooks/browsemStore';
// import { useCurrentCallStore } from '@/hooks/currentCallStore';
// import { useChannelsStore } from '@/hooks/ChannelsStore';
// import { getDomainName } from '@/utils/functions';
// import Channels from './Channels';
import { ChatMessage } from './Channels';
import './Chatroom.scss';
import aniviaUltAsset from "../assets/aniviault.png";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);
let bla: ChatMessage[] = [{
    chatter: {
        session_id: "69420",
        settings: {
            cameraIsOn: false,
            deafened: false,
            microphoneIsOn: true,
            sharingScreen: false
        },
        username: "yassin",
        pfp_s3_key: aniviaUlt
    },
    message: "erhm hi.asdfidfjhawsgdfasjhdfgasskjdhfasdfasdadfklsadfefsdcnxcv"
}];

function Chatroom() {
    // const browsemStore = useBrowsemStore();
    // const currentCall = useCurrentCallStore();
    // const channelsStore = useChannelsStore();
    return (
        <div className="call-chatroom">
            {
                bla.map(chatMessage => (
                    <div className="chat-message-container">
                        <span>
                            <img src={chatMessage.chatter.pfp_s3_key} alt="pfp" />
                            <p className="chat-message-username">{chatMessage.chatter.username}:</p>
                            <p className="chat-message-content">{chatMessage.message}</p>
                        </span>
                    </div>
                ))
            }
        </div>
    )
}

export default Chatroom;
