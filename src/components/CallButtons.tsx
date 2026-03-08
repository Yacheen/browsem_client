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

import "./CallButtons.scss";
import { Tooltip } from '@mui/material';
import { useSettingsStore } from '@/hooks/settingsStore';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import { Chatter } from '@/utils/types';
import { useSnackbarStore } from '@/hooks/snackbarStore';
import pfpPath from "../assets/chatter_default_pfp.png";
const defaultPfp = chrome.runtime.getURL(pfpPath);

function CallButtons(props: { chatter: Chatter }) {
    // const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const hasMicPermission = useCurrentCallStore(state => state.hasMicPermission);
    const hasCampermission = useCurrentCallStore(state => state.hasCamPermission);
    const handleGetMicrophone = useCurrentCallStore(state => state.handleGetMicrophone);
    const handleGetCamera = useCurrentCallStore(state => state.handleGetCamera);
    const muteMic = useCurrentCallStore(state => state.muteMic);
    const unmuteMic = useCurrentCallStore(state => state.unmuteMic);
    const turnOffCamera = useCurrentCallStore(state => state.turnOffCamera);
    const iceConnectionState = useCurrentCallStore(state => state.connection);
    const disconnectFromCall = useCurrentCallStore(state => state.disconnectFromCall);
    const setSnackbar = useSnackbarStore(state => state.setSnackbar);
    const handleDisconnectButtonClicked = () => {
        disconnectFromCall(true);
    }

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
                let camStream = await handleGetCamera(props.chatter.username, setSnackbar);
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
            let camStream = await handleGetCamera(props.chatter.username, setSnackbar);
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
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/click_sound.wav",
                });
            }
            else {
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/click_sound.wav",
                });
                if (props.chatter.settings.deafened === true) {
                    // play undeafened sound
                    await chrome.runtime.sendMessage({
                        type: "play-sound",
                        action: "play",
                        path: "src/assets/sounds/deafen_false.wav",
                    });
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
            let possibleMediaStreamWithMicrophone = await handleGetMicrophone(props.chatter.username, useSettingsStore, setSnackbar);
            if (possibleMediaStreamWithMicrophone !== null) {
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/click_sound.wav",
                });
                if (props.chatter.settings.deafened === true) {
                    // play undeafened sound
                    await chrome.runtime.sendMessage({
                        type: "play-sound",
                        action: "play",
                        path: "src/assets/sounds/deafen_false.wav",
                    });
                }
                setSettings({
                    ...props.chatter.settings,
                    microphoneIsOn: true,
                    deafened: false,
                });
            }
        }
    }
    const handleSetDeafen = async () => {
        if (props.chatter.settings !== undefined) {
            if (props.chatter.settings.deafened) {
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/deafen_false.wav",
                });
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
                await chrome.runtime.sendMessage({
                    type: "play-sound",
                    action: "play",
                    path: "src/assets/sounds/deafen_true.wav",
                });
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
                        {
                            iceConnectionState === "connected"
                            ?
                                <PhoneInTalkIcon className="rtc-status-icon connected-state" />
                            :
                            iceConnectionState === "disconnected"
                            ?
                                <PhoneDisabledIcon className="rtc-status-icon disconnected-state" />
                            :
                            iceConnectionState === "checking"
                            ?
                                <SettingsPhoneIcon className="rtc-status-icon checking-state" />
                            :
                            iceConnectionState === "new"
                            ?
                                <CallEndIcon className="rtc-status-icon" />
                            :
                                null
                        }
                    </div>
                    <p className="rtc-status-text">{iceConnectionState}</p>
                </div>
                <Tooltip placement='top' title="Disconnect" arrow disableInteractive slotProps={{
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
                    <div onClick={handleDisconnectButtonClicked} className="rtc-disconnect-icon-container">
                        <CallEndIcon className="rtc-disconnect-icon" />
                    </div>
                </Tooltip>
            </div>
            <div className="call-buttons-middle">
                <Tooltip arrow disableInteractive title={props.chatter.settings.microphoneIsOn ? 'Mute' : 'Unmute'} placement="top" slotProps={{
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
                <Tooltip arrow disableInteractive title={props.chatter.settings.cameraIsOn ? 'Turn off camera' : 'Turn on camera'} placement="top" slotProps={{
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
                    <div onClick={handleSetVideo} className={`${props.chatter.settings.cameraIsOn ? 'green_background_for_camera' : ''} video-icon-container`}>
                        {
                            props.chatter.settings.cameraIsOn
                            ?
                                <VideocamIcon className="settings-icon" />
                            :
                                <VideocamOffIcon className="settings-icon" />
                        }
                    </div>
                </Tooltip>
                <Tooltip arrow disableInteractive title={props.chatter.settings.deafened ? 'Undeafen' : 'Deafen'} placement="top" slotProps={{
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
                    <img src={defaultPfp} alt="pfp" />
                    <p>{props.chatter.username}</p>
                </div>
                <Tooltip placement='top' title="Call Settings" arrow disableInteractive slotProps={{
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
                }}
                >
                <div className="call-settings-container">
                    <SettingsIcon />
                </div>
                </Tooltip>
            </div>
        </div>
    );
}
export default CallButtons
