import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './BrowsemChatter.scss';
import { Chatter } from '@/utils/types';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import MonitorIcon from '@mui/icons-material/Monitor';
import aniviaUltAsset from "../assets/aniviault.png";
import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/hooks/settingsStore';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { CircularProgress } from '@mui/material';
import { ChatterSetting, useChatterSettingsStore } from '@/hooks/chatterSettingsStore';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

export type QuickchatterWindow = {
    chatter: Chatter, 
    stream?: {
        msid: string,
        type: 'video' | 'screen' | undefined,
    }
};
function BrowsemChatter(props: { chatter: Chatter, handleSetFocusedWindow: (windowToBeFocused: QuickchatterWindow | null) => void, isFocused?: boolean, focusedWindow?: QuickchatterWindow | null, chatterSetting?: ChatterSetting }) {
    let videoRef = useRef<HTMLVideoElement| null>(null);
    let audioRef = useRef<HTMLAudioElement| null>(null);
    const yourUsername = useBrowsemStore(state => state.username);

    const currentCallStore = useCurrentCallStore();
    const remoteStreams = useCurrentCallStore(state => state.remoteStreams);
    const chatterChannel = useBrowsemStore(state => state.chatterChannel);
    const camStream = useCurrentCallStore((state) => state.camStream);
    const micStream = useCurrentCallStore((state) => state.micStream);
    // const screenStream = useCurrentCallStore((state) => state.screenStream);
    const settings = useSettingsStore(state => state.settings);
    const setSettings = useSettingsStore(state => state.setSettings);
    const peerConnection = useCurrentCallStore((state) => state.peerConnection);
    const chatterSettings = useChatterSettingsStore(state => state.chatterSettings);
    const setChatterSettings = useChatterSettingsStore(state => state.setChatterSettings);

    const handleClickedWindow = (type: 'video' | undefined) => {
        if (type !== undefined) {
            props.handleSetFocusedWindow({
                chatter: props.chatter,
                stream: {
                    msid: `${props.chatter.username}_${type}`,
                    type
                },
            });
        }
        else {
            props.handleSetFocusedWindow({
                chatter: props.chatter,
                stream: undefined,
            });
        }
    }

    // whenever ur cam or micstream changes, refresh
    // make sure this chatter is you first
    useEffect(() => {
        if (yourUsername === props.chatter.username) {
            if (micStream !== null) {
                if (audioRef !== null && audioRef.current !== null) {
                    console.log('NEGATIVEONENEGATIVEONE');
                }
            }
            if (camStream !== null) {
                if (videoRef.current !== null) {
                    console.log('CAM STREAM ISNT NULL AND NEITHER IS SRCOBJECT');
                    videoRef.current.srcObject = camStream;
                }
            }
        }
    }, [camStream, micStream]);

    // refreshing cam/mic on this connected chatter for situations, if its you, use cam/micstream, otherwise use remotestreams map
    // whenever u get focused, or the focusedWindow changes 
    // this might have unnecessary re-renders but i'll leave it for now
    // (edge case: person turns camera on during track warmup on chrome, resulting in unmute not being called again after camera is actually available,
    // therefore there is also a dependency for connectedChatter.settings.camerIsOn)
    useEffect(() => {
        // onmount, get ur stream
        if (yourUsername !== null && chatterChannel !== null) {
            //if its you
            if (yourUsername === props.chatter.username) {
                if (audioRef.current && micStream) {
                    console.log('ONEONEONEONEONE');
                    audioRef.current.srcObject = micStream;
                }
                if (videoRef.current && camStream) {
                    console.log('TWOTWOTWOTWOTWO');
                    videoRef.current.srcObject = camStream;
                }
            }
            else {
                // CHECK IF REMOTE STREAMS EXISTS 1st
                if (remoteStreams instanceof Map) {
                    let stream = remoteStreams.get(`${props.chatter.username}`);
                    if (stream !== undefined) {
                        stream.getTracks().forEach(track => {
                            if (track.kind === "audio") {
                                if (audioRef.current) {
                                    console.log('THREETHREETHREETHREE');
                                    audioRef.current.srcObject = stream!;
                                }
                            }
                            if (track.kind === "video") {
                                if (videoRef.current) {
                                    console.log('FOURFOURFOURFOURFOUR');
                                    videoRef.current.srcObject = stream!;
                                }
                            }
                        })
                    }
                }
            }
        }
    }, [props.isFocused, yourUsername, remoteStreams, props.focusedWindow, props.chatter.settings?.cameraIsOn])

    useEffect(() => {
        // set audio elements volume to the volume number
        if (audioRef.current && props.chatterSetting !== undefined) {
            audioRef.current.volume = props.chatterSetting.microphoneVolume * 0.01;
        }
    }, [props.chatterSetting]);
    const handleChatterMicVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let exists = chatterSettings.find(chatter => chatter.username === props.chatter.username);
        if (exists) {
            const newChatterSettings = chatterSettings.map(chatter => {
                if (chatter.username === props.chatter.username) {
                    return {
                        ...chatter,
                        microphoneVolume: event.currentTarget.valueAsNumber
                    };
                }
                else {
                    return chatter;
                }
            })
            setChatterSettings(newChatterSettings);
        }
        else {
            let newSettings: ChatterSetting = {
                username: props.chatter.username,
                screenshareVolume: 50,
                microphoneVolume: event.currentTarget.valueAsNumber,
                hidingVideo: false,
            };
            setChatterSettings([...chatterSettings, newSettings]);
        }
    }

    return (
        <div className={`chatter-container ${props.isFocused ? 'focused_window' : null} ${props.focusedWindow !== null && !props.isFocused ? 'non_focused_window' : null}`}>
            { /*<div onClick={handleSetFocusedWindow} className="chatter-camera-off">
                <img className="chatter-pfp" src={aniviaUlt} alt="pfp" />
            </div> */}
            {
                props.isFocused
                ?
                    props.focusedWindow
                    ?
                        props.chatter.settings.cameraIsOn && peerConnection !== null 
                        ?
                            <div id={`chatter_camera_on_${props.chatter.username}`} onClick={() => handleClickedWindow('video')} className="chatter_camera_on">
                                <div className="video_loading_icon_container">
                                    <CircularProgress className="video_loading_icon" />
                                </div>
                                <video
                                    autoPlay
                                    id={`${props.chatter.username}_video`}
                                    ref={videoRef}
                                    muted
                                >
                                </video>
                            </div>
                            :
                            <div id={`chatter_camera_off_${props.chatter.username}`} onClick={() => handleClickedWindow(undefined)} className='chatter_camera_off'>
                                <img className="chatter-pfp" src={aniviaUlt} alt="pfp" />
                            </div>
                        :
                        <div onClick={() => handleClickedWindow(undefined)} className="chatter_camera_off focused_window_tint">
                            <img className="chatter-pfp" src={aniviaUlt} alt="pfp" />
                        </div>
                    :
                props.focusedWindow?.chatter.username === props.chatter.username && (props.focusedWindow.stream?.type === "video" || props.focusedWindow.stream === undefined)
                ?
                    <div onClick={() => handleClickedWindow(undefined)} className="chatter_camera_off focused_window_tint">
                        <img className="chatter-pfp" src={aniviaUlt} alt="profile picture" /> 
                    </div>
                :
                props.chatter.settings.cameraIsOn && peerConnection !== null
                ?
                    <div id={`chatter_camera_on_${props.chatter.username}`} onClick={() => handleClickedWindow('video')} className="chatter_camera_on">
                        <div className="video_loading_icon_container">
                            <CircularProgress className="video_loading_icon" />
                        </div>
                        <video
                            autoPlay
                            id={`${props.chatter.username}_video`}
                            ref={videoRef}
                            muted
                        >
                        </video>
                    </div>
                :
                    <div id={`chatter_camera_off_${props.chatter.username}`} onClick={() => handleClickedWindow(undefined)} className="chatter_camera_off">
                        <img className="chatter-pfp" src={aniviaUlt} alt="pfp" /> 
                    </div>
            }
            {
                props.isFocused
                ?
                    null
                :
                    <audio
                        ref={audioRef}
                        autoPlay
                        id={`${props.chatter.username}_audio`}
                        muted={props.chatter.username === yourUsername ? true : settings.deafened ? true : false}
                    />
            }
            <div className="chatter-bottom">
                <p>{props.chatter.username}</p> 

                {
                    props.chatter.username === yourUsername
                    ?
                        null
                    :
                        <div className={`input-slider-container`}>
                            <div className={`chatter-volume-meta-container`}>
                                <VolumeUpIcon className={`chatter-volume-icon`} />
                                <p className={`chatter-volume-meta`}>{chatterSettings.find(chatter => chatter.username ===  props.chatter.username)?.microphoneVolume ?? 50}</p>
                            </div>
                            <input onChange={handleChatterMicVolumeChange} type="range" min="0" max="100" value={chatterSettings.find(chatter => chatter.username === props.chatter.username)?.microphoneVolume ?? 50} className={`input-slider`} id="input-slider" />
                        </div>
                }

                <div className="chatter-settings">
                    <div className="chatter-settings-icon-container">
                        {props.chatter.settings.microphoneIsOn ? null : <MicOffIcon />}
                    </div>
                    <div className="chatter-settings-icon-container">
                        {props.chatter.settings.cameraIsOn ? <VideocamIcon /> : null}
                    </div>
                    <div className="chatter-settings-icon-container">
                        {props.chatter.settings.deafened ? <HeadsetOffIcon /> : null}
                    </div>
                    <div className="chatter-settings-icon-container">
                        {props.chatter.settings.sharingScreen ? <MonitorIcon /> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BrowsemChatter;
