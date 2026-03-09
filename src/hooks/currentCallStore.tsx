// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create, StoreApi } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { SettingsStore } from './settingsStore';
import { UseBoundStore } from 'zustand';
import { QuickchatterWindow } from '@/components/BrowsemChatter';
import { AnswerFromClient, AnswerFromServer, DisconnectedFromCall, IceCandidate, OfferFromClient, OfferFromServer } from '@/utils/types';
import { useBrowsemStore } from './browsemStore';
import { Dispatch, SetStateAction } from 'react';
import { AlertColor } from '@mui/material';

interface CurrentCallStoreState {
    peerConnection: RTCPeerConnection | null,
    remoteStreams: Map<string, MediaStream>,
    connection: RTCIceConnectionState,
    monitorSpeakingIntervalIds: Map<string, number>,
    makingOffer: boolean,
    focusedWindow: QuickchatterWindow | null,
    loadingMyVideo: boolean,
    micStream: MediaStream | null,
    camStream: MediaStream | null,
    pendingCamStream: boolean,
    pendingMicStream: boolean,
    audioContext: AudioContext | null,
    micThreshold: number,
    audioTx: RTCRtpTransceiver | null,
    videoTx: RTCRtpTransceiver | null,
    hasMicPermission: boolean,
    hasCamPermission: boolean,
    pendingIceCandidates: RTCIceCandidateInit[],
    setFocusedWindow: (chatterWindow: QuickchatterWindow | null) => void,
    disconnectedFromCall: (msg: DisconnectedFromCall) => Promise<void>,
    disconnectFromCall: (killingSocketAsWell: boolean) => Promise<void>,
    startPeerConnection: () => Promise<RTCPeerConnection>,
    handleIceCandidateFromServer: (message: IceCandidate) => Promise<void>,
    handleCreateOffer: () => Promise<void>,
    monitorSpeaking: (username: string, stream: MediaStream, onSpeakingChange: (isSpeaking: boolean) => void) => void,
    handleAnswerFromServer: (message: AnswerFromServer) => Promise<void>,
    handleOfferFromServer: (message: OfferFromServer) => Promise<void>,
    stopMonitoringSpeakers: () => void,
    handleApplyMicSettings: (username: string, stream: MediaStream, settingsStore: UseBoundStore<StoreApi<SettingsStore>>) => void,
    handleGetMicrophone: (username: string, settingsStore: UseBoundStore<StoreApi<SettingsStore>>, setSnackbar: (active: boolean, message: string, type: AlertColor) => void) => Promise<MediaStream | null>,
    handleGetCamera: (setSnackbar: (active: boolean, message: string, type: AlertColor) => void) => Promise<MediaStream | null>,
    muteMic: () => void;
    unmuteMic: () => void;
    turnOffMicrophone: () => void;
    turnOffCamera: () => void;
}
const servers = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};

export const useCurrentCallStore = create<CurrentCallStoreState>()(
    (set, get) => ({
        connection: "disconnected",
        makingOffer: false,
        loadingMyVideo: false,
        micThreshold: 15,
        hasMicPermission: false,
        hasCamPermission: false,
        pendingIceCandidates: [],

        // dont persist any of these in session storage (u cant persist a mediastream, or an audiocontext, peerConnection, etc.))
        audioTx: null,
        videoTx: null, 
        micStream: null,
        camStream: null,
        pendingCamStream: false,
        pendingMicStream: false,
        audioContext: null,
        remoteStreams: new Map(),
        peerConnection: null,
        monitorSpeakingIntervalIds: new Map(),
        focusedWindow: null,
        setFocusedWindow: (windowToBeFocused: QuickchatterWindow | null) => {
            set({ focusedWindow: windowToBeFocused });
        },
        disconnectedFromCall: async (msg: DisconnectedFromCall) => {
            let stopMonitoringSpeakers = get().stopMonitoringSpeakers;
            let audioContext = get().audioContext;
            let peerConnection = get().peerConnection;
            let turnOffCam = get().turnOffCamera;
            let turnOffMicrophone = get().turnOffMicrophone;
            stopMonitoringSpeakers();
            await audioContext?.close();
            turnOffCam();
            turnOffMicrophone();
            peerConnection?.close();
            let yourUsername = useBrowsemStore.getState().username;
            if (yourUsername === msg.DisconnectedFromCall.disconnectedChatter.username) {
                if (msg.DisconnectedFromCall.reason === "joining another call") {
                    set({
                        connection: "disconnected",
                        audioContext: null,
                        audioTx: null,
                        monitorSpeakingIntervalIds: new Map(),
                        videoTx: null,
                        camStream: null,
                        focusedWindow: null,
                        loadingMyVideo: false,
                        makingOffer: false,
                        micStream: null,
                        peerConnection: null,
                        remoteStreams: new Map(),
                        pendingCamStream: false,
                        pendingMicStream: false,
                        pendingIceCandidates: [],
                    });
                }
                else {
                    set({
                        connection: "disconnected",
                        audioContext: null,
                        audioTx: null,
                        monitorSpeakingIntervalIds: new Map(),
                        videoTx: null,
                        camStream: null,
                        focusedWindow: null,
                        loadingMyVideo: false,
                        makingOffer: false,
                        micStream: null,
                        peerConnection: null,
                        remoteStreams: new Map(),
                        pendingCamStream: false,
                        pendingMicStream: false,
                        pendingIceCandidates: [],
                    });
                }
            }
            // else {
            // }
        },
        disconnectFromCall: async (killingSocketAsWell: boolean) => {
            chrome.runtime.sendMessage({
                type: "disconnect-from-call",
            });
            if (killingSocketAsWell) {
                let stopMonitoringSpeakers = get().stopMonitoringSpeakers;
                let audioContext = get().audioContext;
                let peerConnection = get().peerConnection;
                let turnOffCam = get().turnOffCamera;
                let turnOffMicrophone = get().turnOffMicrophone;
                stopMonitoringSpeakers();
                await audioContext?.close();
                turnOffCam();
                turnOffMicrophone();
                peerConnection?.close();
                set({
                    connection: "disconnected",
                    audioContext: null,
                    audioTx: null,
                    monitorSpeakingIntervalIds: new Map(),
                    videoTx: null,
                    camStream: null,
                    focusedWindow: null,
                    loadingMyVideo: false,
                    makingOffer: false,
                    micStream: null,
                    peerConnection: null,
                    remoteStreams: new Map(),
                    pendingCamStream: false,
                    pendingMicStream: false,
                    pendingIceCandidates: [],
                });
            }
        },
        startPeerConnection: async () => {
            let peerConnection = new RTCPeerConnection(servers);
            let audioContext = new AudioContext();
            
            peerConnection.oniceconnectionstatechange = () => {
                // handleICEConnectionStateChangeEvent(sessionId, socket);
                let micStream = get().micStream;
                let camStream = get().camStream;

                let handleCreateOffer = get().handleCreateOffer;
                if (peerConnection) {
                    if (peerConnection.iceConnectionState === "failed") {
                        // retry in x amount of seconds instead of this if disonnected and not failed?
                        //await handleCreateOffer(sessionId, socket)
                        // micStream?.getTracks().forEach(track => {
                        //     track.stop();
                        // });
                        // camStream?.getTracks().forEach(track => {
                        //     track.stop();
                        // });
                        // peerConnection.close();
                        // peerConnection.restartIce();
                    }
                    // else if (peerConnection.iceConnectionState === "closed") {
                    //     peerConnection.restartIce();
                    // }
                    if (peerConnection) {
                        return set((prevState => ({...prevState, connection: peerConnection.iceConnectionState})));
                    }
                }
            }
            peerConnection.onicecandidate = (event) => {
                // handleIceCandidateEvent(event, sessionId, socket);
                let peerConnection = get().peerConnection;
                // send ice cand to serber
                if (event.candidate && peerConnection) {
                    let iceCandidate: IceCandidate = {
                        IceCandidate: {
                            candidate: event.candidate.candidate,
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex,
                            usernameFragment: event.candidate.usernameFragment,
                        }
                    };
                    chrome.runtime.sendMessage({
                        type: "ice-candidate",
                        contents: JSON.stringify(iceCandidate),
                    })
                }
            }
            peerConnection.ontrack = ({ track, streams }: { track: MediaStreamTrack, streams: readonly MediaStream[] }) => {
                // handleTrackEvent(track, streams);
                // stream id format:
                // uuid_username_kind

                // examples (there is no screensharing atm)
                // [uuidv4::new()]_joemomma_screenaudio
                // [uuidv4::new()]_mynamajeff_video
                // [uuidv4::new()]_mynamajeff_audio
                // [uuidv4::new()]_joemomma_screen
                let stream = streams[0];
                let streamId = stream.id;
                let streamIdAsArray = streamId.split('_');
                let uuid = streamIdAsArray[0];
                let username = streamIdAsArray[1];
                let type = streamIdAsArray[2];

                let peerConnection = get().peerConnection;
                let remoteStreams = get().remoteStreams;
                let monitorSpeaking = get().monitorSpeaking;

                // if (type === "screen" || type === "screenaudio") {
                //
                // }
                if (type === "audio" || type === "video") {
                    if (peerConnection) {
                        let newRemoteStreams = new Map(remoteStreams);
                        if (newRemoteStreams.has(username)) {
                            let existingStream = newRemoteStreams.get(username)!;
                            existingStream.getTracks().forEach(t => {
                                if (t.kind !== track.kind) {
                                    stream.addTrack(t);
                                }
                            });
                        }
                        newRemoteStreams.set(username, stream);
                        set({ remoteStreams: newRemoteStreams });
                    }
                }
                if (type === "audio") {
                    monitorSpeaking(username, stream, isSpeaking => {
                        if (isSpeaking) {
                            // get chatter_camera_on and chatter_camera_off with id of said person
                            // if theres a chatter_camera_on, highlight that
                            // else, highlight chatter camera off
                            let chatterCameraOnElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_on_${username}`);
                            let chatterCameraOffElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_off_${username}`);
                            if (chatterCameraOnElement !== null) {
                                chatterCameraOnElement?.classList.add('speaking_border');
                            }
                            else if (chatterCameraOffElement !== null) {
                                chatterCameraOffElement?.classList.add('speaking_border');
                            }
                        }
                        else {
                            let chatterCameraOnElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_on_${username}`);
                            let chatterCameraOffElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_off_${username}`);
                            if (chatterCameraOnElement !== null) {
                                chatterCameraOnElement?.classList.remove('speaking_border');
                            }
                            else if (chatterCameraOffElement !== null) {
                                chatterCameraOffElement?.classList.remove('speaking_border');
                            }
                        }
                    })
                }
                track.onunmute = () => {
                    if (type === "audio") {
                        track.enabled = true;
                        let audio: HTMLAudioElement | null | undefined = document.querySelector('#browsem-host')?.shadowRoot?.querySelector(`#${username}_audio`);
                        if (audio) {
                            audio.srcObject = stream;
                        }
                    }
                    if (type === "video") {
                        let videoElement: HTMLVideoElement | null | undefined = document.querySelector('#browsem-host')?.shadowRoot?.querySelector(`#${username}_video`);
                        if (videoElement) {
                            videoElement.srcObject = stream;
                        }
                    }
                }
                track.onmute = () => {
                    if (type === "audio") {
                    } 
                    if (type === "video") {
                        let videoElement: HTMLVideoElement | null | undefined = document.querySelector('#browsem-host')?.shadowRoot?.querySelector(`#${username}_video`);
                        if (videoElement) {
                            videoElement.srcObject = null;
                        }
                    }
                }
                // track.onended = () => {}
                // stream.onaddtrack = () => {}
                // stream.onremovetrack = () => {}
            }
            // peerConnection.onnegotiationneeded = async () => {
            //     // handleNegotiationNeededEvent(sessionId, socket)
            //     let handleCreateOffer = get().handleCreateOffer;
            //     await handleCreateOffer();
            // }
            peerConnection.onconnectionstatechange = () => {
            }
            peerConnection.onicecandidateerror = () => {
            }
            set({
                peerConnection,
                connection: peerConnection.iceConnectionState,
                remoteStreams: new Map(),
                monitorSpeakingIntervalIds: new Map(),
                audioContext,
            });
            return peerConnection;
        },
        handleIceCandidateFromServer: async (message: IceCandidate) => {
            let peerConnection = get().peerConnection;
            let pendingIceCandidates = get().pendingIceCandidates;
            if (!peerConnection || peerConnection.remoteDescription === null) {
                set({ pendingIceCandidates: [...pendingIceCandidates, message.IceCandidate]});
            }
            else {
                await peerConnection?.addIceCandidate(message.IceCandidate);
            }
        },
        handleCreateOffer: async () => {
            let peerConnection = get().peerConnection;
            try {
                set({ makingOffer: true });
                if (peerConnection) {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    if (peerConnection.localDescription) {
                        let offerFromClient: OfferFromClient = {
                            OfferFromClient: peerConnection.localDescription
                        };
                        chrome.runtime.sendMessage({
                            type: "create-offer",
                            contents: JSON.stringify(offerFromClient)
                        });
                    }
                }
            }
            catch (err) {
            }
            finally {
                set({ makingOffer: false });
            }
        },
        monitorSpeaking: (username: string, stream: MediaStream, onSpeakingChange: (isSpeaking: boolean) => void) => {
            let audioContext = get().audioContext;

            if (audioContext) {
                const source = audioContext.createMediaStreamSource(stream);
                const destNode = audioContext.createMediaStreamDestination();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;

                source.connect(analyser).connect(destNode);

                const checkVolume = () => {
                    let peerConnection = get().peerConnection;
                    // let chatterChannel = get().chatterChannel;
                    let chatterChannel = useBrowsemStore.getState().chatterChannel;
                    let monitorSpeakingIntervalIds = get().monitorSpeakingIntervalIds
                    // cancel if u cant find urself in independentCall nor connectedToLivepost
                    if (!peerConnection) {
                        return;
                    }
                    if (chatterChannel) {
                        if (chatterChannel.chatters.find(chatter => chatter.username === username) === undefined) return;
                    }
                    const data = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(data);
                    const volume = data.reduce((a, b) => a + b) / data.length;

                    if (volume > 0) {
                        onSpeakingChange(true);
                    }
                    else {
                        onSpeakingChange(false);
                    }
                    
                    if (monitorSpeakingIntervalIds.get(username) === undefined) {
                        let newMonitorSpeakingId = requestAnimationFrame(checkVolume);
                        const newMonitorSpeakingIntervalIds = new Map(monitorSpeakingIntervalIds);
                        newMonitorSpeakingIntervalIds.set(username, newMonitorSpeakingId);

                        set({ monitorSpeakingIntervalIds: newMonitorSpeakingIntervalIds });
                    }
                    else {
                        requestAnimationFrame(checkVolume);
                    }
                }
                checkVolume();
            }
            else {
            }
        },
        handleAnswerFromServer: async (message: AnswerFromServer) => {
            let peerConnection = get().peerConnection;
            let pendingIceCandidates = get().pendingIceCandidates;
            try {
                await peerConnection?.setRemoteDescription(message.AnswerFromServer);
                for (const cand of pendingIceCandidates) {
                    await peerConnection?.addIceCandidate(cand);
                }
                set({ pendingIceCandidates: [] });
            }
            catch (err) {
            }
        },
        handleOfferFromServer: async (message: OfferFromServer) => {
            let peerConnection = get().peerConnection;
            let startPeerConnection = get().startPeerConnection;
            if (peerConnection === null) {
                peerConnection = await startPeerConnection();
            }

            let makingOffer = get().makingOffer;
            let pendingIceCandidates = get().pendingIceCandidates;
            let micStream = get().micStream;
            let camStream = get().camStream;
            let pendingMicStream = get().pendingMicStream;
            let pendingCamStream = get().pendingCamStream;


            let msgSdp: RTCSessionDescriptionInit = message.OfferFromServer;
            try {
                await peerConnection?.setRemoteDescription(msgSdp);
                for (const cand of pendingIceCandidates) {
                    await peerConnection?.addIceCandidate(cand);
                }
                set({ pendingIceCandidates: [] });
                // set both transceivers to sendonly so answer has a=sendonly instead of a=inactive
            }
            catch (err) {
            }

            // if (peerConnection) {
            //     // attach pending camera
            //     if (pendingCamStream && camStream) {
            //         const videoTx = peerConnection.getTransceivers().find(tx => {
            //             const mid = tx.mid;
            //             const remoteDesc = peerConnection.remoteDescription?.sdp;
            //             if (!remoteDesc || !mid) return false;
            //             // find the m-section for this mid and check if server said recvonly
            //             const section = remoteDesc.split('\r\nm=').find(s => s.includes(`a=mid:${mid}`));
            //             return tx.receiver.track.kind === 'video' && section?.includes('a=recvonly');
            //         });
            //         if (videoTx) {
            //             await videoTx.sender.replaceTrack(camStream.getVideoTracks()[0]);
            //             videoTx.direction = 'sendonly';
            //             set({ videoTx, pendingCamStream: false });
            //         }
            //         // const transceivers = peerConnection?.getTransceivers()
            //         // const videoTx = transceivers[transceivers.length - 1];
            //         // if (videoTx) {
            //         //     await videoTx.sender.replaceTrack(camStream.getVideoTracks()[0]);
            //         //     videoTx.direction = "sendonly";
            //         // }
            //         // set({ videoTx, pendingCamStream: false });
            //     }
            //     // attach pending mic
            //     if (pendingMicStream && micStream) {
            //         const audioTx = peerConnection.getTransceivers().find(tx => {
            //             const mid = tx.mid;
            //             const remoteDesc = peerConnection.remoteDescription?.sdp;
            //             if (!remoteDesc || !mid) return false;
            //             // find the m-section for this mid and check if server said recvonly
            //             const section = remoteDesc.split('\r\nm=').find(s => s.includes(`a=mid:${mid}`));
            //             return tx.receiver.track.kind === 'audio' && section?.includes('a=recvonly');
            //         });
            //         if (audioTx) {
            //             await audioTx.sender.replaceTrack(micStream.getAudioTracks()[0]);
            //             audioTx.direction = 'sendonly';
            //             set({ audioTx, pendingCamStream: false });
            //         }
            //
            //         // const transceivers = peerConnection.getTransceivers()
            //         // const audioTx = transceivers[transceivers.length - 1];
            //         // if (audioTx) {
            //         //     await audioTx.sender.replaceTrack(micStream.getAudioTracks()[0]);
            //         //     audioTx.direction = "sendonly";
            //         // }
            //         // set({ audioTx, pendingMicStream: false });
            //     }
            // }

            for (const tx of peerConnection.getTransceivers()) {
                tx.direction = 'sendrecv';
            }
            const answer = await peerConnection?.createAnswer();
            await peerConnection?.setLocalDescription(answer);

            if (peerConnection && peerConnection.localDescription) {
                let answerFromClient: AnswerFromClient = {
                    // what the helly
                    AnswerFromClient: peerConnection.localDescription
                };
                chrome.runtime.sendMessage({
                    type: "answer-from-client",
                    contents: JSON.stringify(answerFromClient),
                });
            }
        },
        stopMonitoringSpeakers: () => {
            let peerConnection = get().peerConnection;
            let monitorSpeakingIntervalIds = get().monitorSpeakingIntervalIds;
            if (peerConnection) {
                // cancel all animation frames
                monitorSpeakingIntervalIds.forEach(animationId => {
                    cancelAnimationFrame(animationId);
                });

                const newMonitorSpeakingIntervalIds = new Map();

                set({ monitorSpeakingIntervalIds: newMonitorSpeakingIntervalIds });
            }
        },
        // voiceAndVideoSettings: VoiceAndVideoSettings, settings: settings
        handleApplyMicSettings: (username: string, stream: MediaStream, settingsStore: UseBoundStore<StoreApi<SettingsStore>>) => {
            let audioContext = get().audioContext;
            let peerConnection = get().peerConnection;
            let audioTx = get().audioTx;

            if (audioContext) {
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                source.connect(analyser);

                const destNode = audioContext.createMediaStreamDestination();
                source.connect(destNode);

                const data = new Uint8Array(analyser.frequencyBinCount);
                const applyMicSettings = () => {
                    let micThreshold = get().micThreshold;
                    if (destNode.stream.getAudioTracks().length > 0) {
                        let innerPeerConnection = get().peerConnection;
                        let innerMonitorSpeakingIntervalIds = get().monitorSpeakingIntervalIds
                        let settings = settingsStore.getState().settings;
                        if (innerPeerConnection) {
                            analyser.getByteFrequencyData(data);
                            const volume = data.reduce((a, b) => a + b, 0) / data.length;
                            if (settings.microphoneIsOn) {
                                if (volume > micThreshold) {
                                    destNode.stream.getAudioTracks()[0].enabled = true;
                                    let chatterCameraOnElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_on_${username}`);
                                    let chatterCameraOffElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_off_${username}`);
                                    if (chatterCameraOnElement !== null) {
                                        chatterCameraOnElement?.classList.add('speaking_border');
                                    }
                                    else if (chatterCameraOffElement !== null) {
                                        chatterCameraOffElement?.classList.add('speaking_border');
                                    }
                                }
                                else {
                                    destNode.stream.getAudioTracks()[0].enabled = false;
                                    let chatterCameraOnElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_on_${username}`);
                                    let chatterCameraOffElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_off_${username}`);
                                    if (chatterCameraOnElement !== null) {
                                        chatterCameraOnElement?.classList.remove('speaking_border');
                                    }
                                    else if (chatterCameraOffElement !== null) {
                                        chatterCameraOffElement?.classList.remove('speaking_border');
                                    }

                                }
                            }
                            else {
                                destNode.stream.getAudioTracks()[0].enabled = false;
                                let chatterCameraOnElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_on_${username}`);
                                let chatterCameraOffElement = document.querySelector('#browsem-host')?.shadowRoot?.getElementById(`chatter_camera_off_${username}`);
                                if (chatterCameraOnElement !== null) {
                                    chatterCameraOnElement?.classList.remove('speaking_border');
                                }
                                else if (chatterCameraOffElement !== null) {
                                    chatterCameraOffElement?.classList.remove('speaking_border');
                                }
                            }
                            if (innerMonitorSpeakingIntervalIds.get(username) === undefined) {
                                let newMonitorSpeakingId = requestAnimationFrame(applyMicSettings);
                                const newMonitorSpeakingIntervalIds = new Map(innerMonitorSpeakingIntervalIds);
                                newMonitorSpeakingIntervalIds.set(username, newMonitorSpeakingId);

                                set({ monitorSpeakingIntervalIds: newMonitorSpeakingIntervalIds });
                            }
                            else {
                                requestAnimationFrame(applyMicSettings);
                            }
                        }
                    }
                }
                applyMicSettings();
                const audioTx = peerConnection?.getTransceivers().find(tx => tx.receiver.track.kind === 'audio');
                if (audioTx) {
                    audioTx.sender.replaceTrack(destNode.stream.getAudioTracks()[0]);
                    set({ hasMicPermission: true, micStream: destNode.stream, audioTx });
                }
                // else {
                //     chrome.runtime.sendMessage({ type: "enable-mic" });
                //     set({ hasMicPermission: true, micStream: destNode.stream, pendingMicStream: true });
                // }
            }
            else {
            }
        },
        handleGetMicrophone: async (username: string, settingsStore: UseBoundStore<StoreApi<SettingsStore>>, setSnackbar: (active: boolean, message: string, type: AlertColor) => void) => {
            let handleApplyMicSettings = get().handleApplyMicSettings;
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: {
                        channelCount: 2,
                        autoGainControl: false,
                        echoCancellation: false,
                        noiseSuppression: false,
                        // deviceId: {}
                    }
                })
                handleApplyMicSettings(username, micStream, settingsStore);
                return micStream;
            }
            catch (err) {
                if (err instanceof Error) {
                    setSnackbar(true, err.message, "error");
                }
                else {
                    setSnackbar(true, "Unknown error getting microphone", "error");
                }
                set({ hasMicPermission: false });
                return null;
            }
        },
        handleGetCamera: async (setSnackbar: (active: boolean, message: string, type: AlertColor) => void) => {
            let peerConnection = get().peerConnection;
            let videoTx = get().videoTx;
            try {
                const camStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: {
                            ideal: 60,
                            min: 30,
                            max: 60,
                        },
                        // deviceId: {}
                    }
                })
                const peerConnection = get().peerConnection;
                const videoTx = peerConnection?.getTransceivers().find(tx => tx.receiver.track.kind === 'video');
                if (videoTx) {
                    await videoTx.sender.replaceTrack(camStream.getVideoTracks()[0]);
                    set({ hasCamPermission: true, camStream, videoTx, pendingCamStream: false });
                }
                // if (videoTx !== null) {
                //     await videoTx.sender.replaceTrack(camStream.getVideoTracks()[0]);
                //     set({ hasCamPermission: true, camStream, videoTx, pendingCamStream: true });
                // }
                // else {
                //     chrome.runtime.sendMessage({ type: "enable-camera" });
                //     set({ hasCamPermission: true, camStream, pendingCamStream: true });
                // }
                // let videoElement: HTMLVideoElement | null | undefined = document.querySelector('#browsem-host')?.shadowRoot?.querySelector(`#${username}_video`);
                // if (videoElement) {
                //     videoElement.srcObject = camStream;
                // }
                return camStream;
            }
            catch (err) {
                if (err instanceof Error) {
                    setSnackbar(true, err.message, "error");
                }
                else {
                    setSnackbar(true, "Unknown error getting camera", "error");
                }
                set({ hasCamPermission: false });
                return null;
            }
        },
        muteMic: () => {
            let micStream = get().micStream;
            if (micStream && micStream.getAudioTracks()[0]) {
                micStream.getAudioTracks()[0].enabled = false;
                return set({ micStream });
            }
        },
        unmuteMic: () => {
            let micStream = get().micStream;
            if (micStream && micStream.getAudioTracks()[0]) {
                micStream.getAudioTracks()[0].enabled = true;
                set({ micStream });
            }
        },
        turnOffCamera: () => {
            let camStream = get().camStream;
            let peerConnection = get().peerConnection;
            let videoTx = get().videoTx;

            if (camStream && camStream.getVideoTracks()[0]) {
                let track = camStream.getVideoTracks()[0];
                track.stop();
                camStream.removeTrack(track);
                if (videoTx && videoTx.sender) {
                    videoTx.sender.replaceTrack(null);
                }
            }
            set({ camStream: null, videoTx, peerConnection, hasCamPermission: false });
        },
        turnOffMicrophone: () => {
            let micStream = get().micStream;
            let peerConnection = get().peerConnection;
            let audioTx = get().audioTx;
            
            if (micStream && micStream.getAudioTracks()[0]) {
                micStream.getAudioTracks().forEach(track => {
                    track.stop();
                    micStream?.removeTrack(track);
                    if (audioTx && audioTx.sender) {
                        audioTx?.sender.replaceTrack(null);
                    }
                })
            }
            set({ micStream: null, audioTx, peerConnection, hasMicPermission: false, });
        },
    }),
);
