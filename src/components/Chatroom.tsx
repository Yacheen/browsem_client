// import { useBrowsemStore } from '@/hooks/browsemStore';
// import { useCurrentCallStore } from '@/hooks/currentCallStore';
// import { useChannelsStore } from '@/hooks/ChannelsStore';
// import { getDomainName } from '@/utils/functions';
// import Channels from './Channels';
import './Chatroom.scss';
import pfpPath from "../assets/chatter_default_pfp.png";
const defaultPfp = chrome.runtime.getURL(pfpPath);
import SettingsIcon from '@mui/icons-material/Settings';
import { Tooltip } from '@mui/material';
import { ChannelMessage } from '@/utils/types';
import { ChangeEvent, useEffect, useState } from 'react';
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
//         pfpS3Key: defaultPfp
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
    const scrollToBottom = (element: HTMLElement) => {
        // element.lastElementChild?.scrollIntoView({ block: "nearest", inline: "end" });
        element.scrollTop = element.scrollHeight;
    };
    useEffect(() => {
        let chat = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`call-chatroom`);
        if (chat) {
            scrollToBottom(chat);
        }
    }, [chatterChannel?.channelMessages])

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey && inputMessage.length > 0) {
            event.preventDefault();
            handleSendChannelMessage();
        }
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
            <div id="call-chatroom" className="call-chatroom">
                {
                    chatterChannel === null
                    ?
                        null
                    :
                        chatterChannel.channelMessages.map(chatMessage => (
                            <div className="chat-message-container">
                                <img src={defaultPfp} alt="pfp" />
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
                    {
                        inputMessage.length > 0
                        ?
                            <p className={`input-characters-remaining ${inputMessage.length > 250 ? 'none-remaining' : ''}`}>{250 - inputMessage.length}</p>
                        :
                            null
                    }
                    <Tooltip placement='top' title="Chat settings" arrow disableInteractive slotProps={{
                        tooltip: {
                            className: "light-tooltip dark-tooltip"
                        },
                        popper: {
                            disablePortal: true,
                            style: {
                                zIndex: 6942013383,
                            }
                        },
                        arrow: {
                            className: "light-tooltip-arrow dark-tooltip-arrow",
                        }
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
