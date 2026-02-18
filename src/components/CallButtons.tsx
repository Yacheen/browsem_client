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
import { Tooltip } from '@mui/material';
import { useSettingsStore } from '@/hooks/settingsStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

function CallButtons(props: { chatter: Chatter }) {
    // const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const peerConnection = useCurrentCallStore(state => state.peerConnection);
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel);
    const hasMicPermission = useCurrentCallStore(state => state.hasMicPermission);
    const hasCampermission = useCurrentCallStore(state => state.hasCamPermission);
    const handleGetMicrophone = useCurrentCallStore(state => state.handleGetMicrophone);
    const handleGetCamera = useCurrentCallStore(state => state.handleGetCamera);
    const muteMic = useCurrentCallStore(state => state.muteMic);
    const unmuteMic = useCurrentCallStore(state => state.unmuteMic);
    const turnOffCamera = useCurrentCallStore(state => state.turnOffCamera);

    const handleSetVideo = async () => {
        if (hasCampermission) {
            if (props.chatter.settings.cameraIsOn) {
                turnOffCamera();
                setSettings({
                    ...props.chatter.settings,
                    cameraIsOn: false
                });
            }
            else {
                let camStream = await handleGetCamera(props.chatter.username);
                if (camStream) {
                    setSettings({
                        ...props.chatter.settings,
                        cameraIsOn:true 
                    });
                }
                else {
                }
            }
        }
        else {
            let camStream = await handleGetCamera(props.chatter.username);
            if (camStream) {
                setSettings({
                    ...props.chatter.settings,
                    cameraIsOn: true
                });
            }
        }
    }
    const handleSetMicrophone = async () => {
        if (hasMicPermission) {
            if (props.chatter.settings.microphoneIsOn) {
                setSettings({
                    ...props.chatter.settings,
                    microphoneIsOn: false
                });
                muteMic();
            }
            else {
                if (props.chatter.settings.deafened === true) {
                    // play undeafened sound
                }
                unmuteMic();
                setSettings({
                    ...props.chatter.settings,
                    microphoneIsOn: true,
                    deafened: false,
                });
            }
        }
        else {
            let possibleMediaStreamWithMicrophone = await handleGetMicrophone(props.chatter.username, useSettingsStore);
            if (possibleMediaStreamWithMicrophone !== null) {
                if (props.chatter.settings.deafened === true) {
                    // play undeafened sound
                }
                setSettings({
                    ...props.chatter.settings,
                    microphoneIsOn: true,
                    deafened: false,
                });
            }
        }
    }
    const handleSetDeafen = () => {
        if (props.chatter.settings !== undefined) {
            if (props.chatter.settings.deafened) {
                setSettings({
                    ...props.chatter.settings,
                    deafened: false,
                })
                // play undeafened sound
                // if (sfxController.current) {
                //     sfxController.current.playSound("/sounds/deafen_false.wav");
                // }
            }
            else {
                setSettings({
                    ...props.chatter.settings,
                    deafened: true,
                    microphoneIsOn: false,
                })
                muteMic();
                // play deafened sound
                // if (sfxController.current) {
                //     sfxController.current.playSound("/sounds/deafen_true.wav");
                // }
            }
        }
    };
    return (
        <div className="call-buttons-container">
            <div className="call-buttons-top">
                <div className="rtc-status-container">
                    <div className="rtc-status-icon-container">
                        <PhoneDisabledIcon className="rtc-status-icon" />
                    </div>
                    <p className="rtc-status-text">Disconnected</p>
                </div>
                <Tooltip placement='top' title="Disconnect" arrow disableInteractive slotProps={{
                    popper: {
                        style: {
                            zIndex: 6942013383,
                        }
                    },
                }}>
                    <div className="rtc-disconnect-icon-container">
                        <CallEndIcon className="rtc-disconnect-icon" />
                    </div>
                </Tooltip>
            </div>
            <div className="call-buttons-middle">
                <Tooltip arrow disableInteractive title={props.chatter.settings.microphoneIsOn ? 'Mute' : 'Unmute'} placement="top" slotProps={{ popper: { style: { zIndex: 6942013383, } } }}>
                    <div onClick={handleSetMicrophone} className="mic-icon-container">
                        {
                            props.chatter.settings.microphoneIsOn
                            ?
                                <MicIcon className="settings-icon" /> 
                            :
                                <MicOffIcon className="settings-icon" />
                        }
                    </div>
                </Tooltip>
                <Tooltip arrow disableInteractive title={props.chatter.settings.cameraIsOn ? 'Turn on camera' : 'Turn off camera'} placement="top" slotProps={{ popper: { style: { zIndex: 6942013383, } } }}>
                    <div onClick={handleSetVideo} className="video-icon-container">
                        {
                            props.chatter.settings.cameraIsOn
                            ?
                                <VideocamIcon className="settings-icon" />
                            :
                                <VideocamOffIcon className="settings-icon" />
                        }
                    </div>
                </Tooltip>
                <Tooltip arrow disableInteractive title={props.chatter.settings.deafened ? 'Undeafen' : 'Deafen'} placement="top" slotProps={{ popper: { style: { zIndex: 6942013383, } } }}>
                    <div onClick={handleSetDeafen} className="deafen-icon-container">
                        {
                            props.chatter.settings.deafened
                            ?
                                <HeadsetOffIcon className="settings-icon" />
                            :
                               <HeadsetIcon className="settings-icon" /> 
                        }
                    </div>
                </Tooltip>
            </div>
            <div className="call-buttons-bottom">
                <div className="chatter-meta-container">
                    <img src={aniviaUlt} alt="pfp" />
                    <p>{props.chatter.username}</p>
                </div>
                <Tooltip placement='top' title="Call Settings" arrow disableInteractive slotProps={{
                    popper: {
                        style: {
                            zIndex: 6942013383,
                        }
                    },
                }}>
                <div className="call-settings-container">
                    <SettingsIcon />
                </div>
                </Tooltip>
            </div>
        </div>
    );
}
export default CallButtons
