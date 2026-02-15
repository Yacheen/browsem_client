// import { useBrowsemStore } from '@/hooks/browsemStore';
// import { useCurrentCallStore } from '@/hooks/currentCallStore';
// import { useChannelsStore } from '@/hooks/ChannelsStore';
// import { getDomainName } from '@/utils/functions';
// import Channels from './Channels';
import { ChatMessage } from './Channels';
import './Chatroom.scss';
import aniviaUltAsset from "../assets/aniviault.png";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);
import SettingsIcon from '@mui/icons-material/Settings';
let bla: ChatMessage[] = [{
    chatter: {
        sessionId: "69420",
        settings: {
            cameraIsOn: false,
            deafened: false,
            microphoneIsOn: true,
            sharingScreen: false
        },
        username: "yassin",
        pfpS3Key: aniviaUlt
    },
    message: "erhm      hi.asdfidfjhawsgdfasjhdfgasskjdhfasdfasdadfklsadfefsdcnxcv"
}];

function Chatroom() {
    // const browsemStore = useBrowsemStore();
    // const currentCall = useCurrentCallStore();
    // const channelsStore = useChannelsStore();
    return (
        <div className="call-chatroom-container">
            <div className="call-chatroom">
                {
                    bla.map(chatMessage => (
                        <div className="chat-message-container">
                            <img src={chatMessage.chatter.pfpS3Key} alt="pfp" />
                            <span className="chat-message-username">{chatMessage.chatter.username}: </span>
                            <span className="chat-message-content">{chatMessage.message}</span>
                        </div>
                    ))
                }
            </div>
            <div className="chatroom-bottom">
                <div className="input-container">
                    <input placeholder="message..." type="text" />
                </div>
                <div className="input-bottom">
                    <div className="input-settings-icon-container">
                        <SettingsIcon  className="input-settings-icon"/>
                    </div>
                    <button className="input-send-button" type="button">Send</button>
                </div>
            </div>
        </div>
    )
}

export default Chatroom;
