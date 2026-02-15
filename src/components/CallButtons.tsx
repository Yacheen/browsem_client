import SettingsPhoneIcon from '@mui/icons-material/SettingsPhone';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import CallEndIcon from '@mui/icons-material/CallEnd';
import SettingsIcon from '@mui/icons-material/Settings';


// mic
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
// video
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
// deafened
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import HeadsetIcon from '@mui/icons-material/Headset';

import { Chatter } from '@/hooks/ChannelsStore';
import aniviaUltAsset from "../assets/aniviault.png";
import "./CallButtons.scss";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

function CallButtons(props: { chatter: Chatter }) {
    return (
        <div className="call-buttons-container">
            <div className="call-buttons-top">
                <div className="rtc-status-container">
                    <div className="rtc-status-icon-container">
                        <PhoneDisabledIcon className="rtc-status-icon" />
                    </div>
                    <p className="rtc-status-text">Disconnected</p>
                </div>
                <div className="rtc-disconnect-icon-container">
                    <CallEndIcon className="rtc-disconnect-icon" />
                </div>
            </div>
            <div className="call-buttons-middle">
                <div className="mic-icon-container">
                    {
                        props.chatter.settings.microphoneIsOn
                        ?
                            <MicIcon className="settings-icon" /> 
                        :
                            <MicOffIcon className="settings-icon" />
                    }
                </div>
                <div className="video-icon-container">
                    {
                        <VideocamIcon className="settings-icon" />
                    }
                </div>
                <div className="deafen-icon-container">
                    {
                        props.chatter.settings.deafened
                        ?
                            <HeadsetOffIcon className="settings-icon" />
                        :
                           <HeadsetIcon className="settings-icon" /> 
                    }
                </div>
            </div>
            <div className="call-buttons-bottom">
                <div className="chatter-meta-container">
                    <img src={aniviaUlt} alt="pfp" />
                    <p>{props.chatter.username}</p>
                </div>
                <div className="call-settings-container">
                    <SettingsIcon />
                </div>
            </div>
        </div>
    );
}
export default CallButtons
