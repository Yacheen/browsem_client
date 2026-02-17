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
import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/hooks/settingsStore';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { CircularProgress } from '@mui/material';
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);

export type QuickchatterWindow = {
    username: string, 
    stream?: {
        msid: string,
        type: 'video' | 'screen' | undefined,
    }
};
export type ChatterSetting = {
    username: string,
    screenshareVolume: number,
    microphoneVolume: number,
    hidingVideo: false,
}
function BrowsemChatter(props: { chatter: Chatter, handleSetFocusedWindow: (windowToBeFocused: QuickchatterWindow | null) => void, isFocused?: boolean, focusedWindow?: QuickchatterWindow, chatterSetting?: ChatterSetting }) {
    let videoRef = useRef<HTMLVideoElement| null>(null);
    let audioRef = useRef<HTMLAudioElement| null>(null);
    const yourUsername = useBrowsemStore(state => state.username);

    const currentCallStore = useCurrentCallStore();
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel);
    const camStream = useCurrentCallStore((state) => state.camStream);
    const micStream = useCurrentCallStore((state) => state.micStream);
    // const screenStream = useCurrentCallStore((state) => state.screenStream);
    const settings = useSettingsStore();
    const peerConnection = useCurrentCallStore((state) => state.peerConnection);

    const handleClickedWindow = (type: 'video' | undefined) => {
        if (type !== undefined) {
            props.handleSetFocusedWindow({
                username: props.chatter.username,
                stream: {
                    msid: `${props.chatter.username}_${type}`,
                    type
                },
            });
        }
        else {
            props.handleSetFocusedWindow({
                username: props.chatter.username,
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

                }
            }
            if (camStream !== null) {
                if (videoRef.current !== null) {
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
                    audioRef.current.srcObject = micStream;
                }
                if (videoRef.current && camStream) {
                    videoRef.current.srcObject = camStream;
                }
            }
            else {
                let stream = currentCallStore.remoteStreams.get(`${props.chatter.username}`);
                if (stream !== undefined) {
                    stream.getTracks().forEach(track => {
                        if (track.kind === "audio") {
                            if (audioRef.current) {
                                audioRef.current.srcObject = stream!;
                            }
                        }
                        if (track.kind === "video") {
                            if (videoRef.current) {
                                videoRef.current.srcObject = stream!;
                            }
                        }
                    })
                }
            }
        }
    }, [props.isFocused, yourUsername, currentCallStore?.remoteStreams, props.focusedWindow, props.chatter.settings?.cameraIsOn])

    useEffect(() => {
        // set audio elements volume to the volume number
        if (audioRef.current && props.chatterSetting !== undefined) {
            audioRef.current.volume = props.chatterSetting.microphoneVolume * 0.01;
        }
    }, [props.chatterSetting]);

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
                props.focusedWindow?.username === props.chatter.username && (props.focusedWindow.stream?.type === "video" || props.focusedWindow.stream === undefined)
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
                        muted={props.chatter.username === yourUsername ? true : settings.settings.deafened ? true : false}
                    />
            }
            <div className="chatter-bottom">
                <p>{props.chatter.username}</p> 
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
