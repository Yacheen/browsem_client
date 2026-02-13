import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './BrowsemChatter.scss';
import { Chatter } from '@/hooks/ChannelsStore';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import MonitorIcon from '@mui/icons-material/Monitor';

function BrowsemChatter(props: { chatter: Chatter }) {
    const currentCallStore = useCurrentCallStore();
    return (
        <div className="chatter-container">
            <div className="chatter-top">
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
