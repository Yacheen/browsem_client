import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './BrowsemChatter.scss';
import { Chatter } from '@/hooks/ChannelsStore';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import MonitorIcon from '@mui/icons-material/Monitor';
import aniviaUltAsset from "../assets/aniviault.png";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

function BrowsemChatter(props: { chatter: Chatter }) {
    const currentCallStore = useCurrentCallStore();
    const handleSetFocusedWindow = () => {
        console.log('meow');
    }
    return (
        <div className="chatter-container">
            <div onClick={handleSetFocusedWindow} className="chatter-top">
                <img className="chatter-pfp" src={aniviaUlt} alt="pfp" />
            </div>
            <div className="chatter-bottom">
                <p>{props.chatter.username}</p> 
                <div className="chatter-settings">
                    <div className="chatter-settings-icon-container">
                        {
                            props.chatter.settings.microphoneIsOn
                            ?
                                null
                            :
                                <MicOffIcon />
                        }
                    </div>
                    <div className="chatter-settings-icon-container">
                        {
                            props.chatter.settings.cameraIsOn
                            ?
                                <VideocamIcon />
                            :
                                null
                        }
                    </div>
                    <div className="chatter-settings-icon-container">
                        {
                            props.chatter.settings.deafened
                            ?
                                <HeadsetOffIcon />
                            :
                                null
                        }
                    </div>
                    <div className="chatter-settings-icon-container">
                        {
                            props.chatter.settings.sharingScreen
                            ?
                                <MonitorIcon />
                            :
                                null
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BrowsemChatter;
