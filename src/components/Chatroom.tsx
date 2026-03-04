// import { useBrowsemStore } from '@/hooks/browsemStore';
// import { useCurrentCallStore } from '@/hooks/currentCallStore';
// import { useChannelsStore } from '@/hooks/ChannelsStore';
// import { getDomainName } from '@/utils/functions';
// import Channels from './Channels';
import './Chatroom.scss';
import aniviaUltAsset from "../assets/aniviault.png";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);
import SettingsIcon from '@mui/icons-material/Settings';
import { Tooltip } from '@mui/material';
import { ChannelMessage } from '@/utils/types';
import { ChangeEvent, useState } from 'react';
import { useBrowsemStore } from '@/hooks/browsemStore';
// let bla: ChannelMessage[] = [{
//     chatter: {
//         sessionId: "69420",
//         settings: {
//             cameraIsOn: false,
//             deafened: false,
//             microphoneIsOn: true,
//             sharingScreen: false
//         },
//         username: "yassin",
//         pfpS3Key: aniviaUlt
//     },
//     message: "erhm      hi.asdfidfjhawsgdfasjhdfgasskjdhfasdfasdadfklsadfefsdcnxcv",
//     timestamp: 694201337,
// }];

function Chatroom() {
    const chatterChannel = useBrowsemStore(state => state.chatterChannel);
    const [inputMessage, setInputMessage] = useState('');
    const handleSetMessage = (event: ChangeEvent<HTMLInputElement>) => {
        setInputMessage(event.currentTarget.value);
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey && inputMessage.length > 0) {
            event.preventDefault();
            handleSendChannelMessage();
        }
        // if (event.key === "Enter") {
        // }
        // if ((event.key === "" || e.keyCode === 13) && e.target.value === "") {
        //     e.preventDefault();
        // } else if ((e.which === 13 || e.keyCode === 13) && e.shiftKey) {
        //     e.preventDefault();
        // } else if ((e.which === 13 || e.keyCode === 13) && !e.shiftKey) {
        //     e.preventDefault();
        //     handleSubmitMessage(e);
        // }
    }
    const handleSendChannelMessage = () => {
        chrome.runtime.sendMessage({
            type: "send-channel-message",
            contents: {
                SendChannelMessage: {
                    message: inputMessage,
                }
            },
        });
        setInputMessage('');
    }


    return (
        <div className="call-chatroom-container">
            <div className="call-chatroom">
                {
                    chatterChannel === null
                    ?
                        null
                    :
                        chatterChannel.channelMessages.map(chatMessage => (
                            <div className="chat-message-container">
                                <img src={aniviaUlt} alt="pfp" />
                                <span className="chat-message-username">{chatMessage.chatter.username}: </span>
                                <span className="chat-message-content">{chatMessage.message}</span>
                            </div>
                        ))
                }
            </div>
            <div className="chatroom-bottom">
                <div className="input-container">
                    <input value={inputMessage} onKeyDown={handleKeyPress} onChange={handleSetMessage} placeholder="message..." type="text" />
                </div>
                <div className="input-bottom">
                    <Tooltip placement='top' title="Chat settings" arrow disableInteractive slotProps={{
                        popper: {
                            style: {
                                zIndex: 6942013383,
                            }
                        },
                    }}>
                        <div className="input-settings-icon-container">
                            <SettingsIcon  className="input-settings-icon"/>
                        </div>
                    </Tooltip>
                    <button onClick={handleSendChannelMessage} className="input-send-button" type="button">Send</button>
                </div>
            </div>
        </div>
    )
}

export default Chatroom;
