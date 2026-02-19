// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create, StoreApi } from 'zustand';
import { ChatterChannel } from '@/components/Channels';
import { Chatter } from './ChannelsStore';
import { AnswerFromClient, AnswerFromServer, ConnectedToCall, DisconnectedFromCall, OfferFromClient, OfferFromServer, UserUpdatedSettings } from '@/popup/App';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChromeSessionStorage } from 'zustand-chrome-storage';
import { Settings, SettingsStore } from './settingsStore';
import { UseBoundStore } from 'zustand';
import { QuickchatterWindow } from '@/components/BrowsemChatter';

interface CurrentCallStoreState {
    chatterChannel: ChatterChannel | null,
    tabId: number | null,
    peerConnection: RTCPeerConnection | null,
    remoteStreams: Map<string, MediaStream>,
    connection: RTCIceConnectionState,
    monitorSpeakingIntervalIds: Map<string, number>,
    makingOffer: boolean,
    focusedWindow: QuickchatterWindow | null,
    loadingMyVideo: boolean,
    micStream: MediaStream | null,
    camStream: MediaStream | null,
    micSender: RTCRtpSender | null,
    camSender: RTCRtpSender | null,
    audioContext: AudioContext | null,
    micThreshold: number,
    audioTx: RTCRtpTransceiver | null,
    hasMicPermission: boolean,
    hasCamPermission: boolean,
    pendingIceCandidates: RTCIceCandidateInit[],
    setFocusedWindow: (chatterWindow: QuickchatterWindow | null) => void,
    setChatterChannel: (chatterChannel: ChatterChannel | null) => void,
    connectToCall: (channelName: string) => void,
    connectedToCall: (msg: ConnectedToCall, tabId: number) => void,
    reconnectToCall: (channelName: string) => void,
    disconnectedFromCall: (msg: DisconnectedFromCall) => Promise<void>,
    disconnectFromCall: () => void,
    startPeerConnection: () => Promise<void>,
    handleIceCandidateFromServer: (message: IceCandidate) => Promise<void>,
    handleCreateOffer: () => Promise<void>,
    monitorSpeaking: (username: string, stream: MediaStream, onSpeakingChange: (isSpeaking: boolean) => void) => void,
    handleAnswerFromServer: (message: AnswerFromServer) => Promise<void>,
    handleOfferFromServer: (message: OfferFromServer) => Promise<void>,
    stopMonitoringSpeakers: () => void,
    handleApplyMicSettings: (username: string, stream: MediaStream, settingsStore: UseBoundStore<StoreApi<SettingsStore>>) => void,
    handleGetMicrophone: (username: string, settingsStore: UseBoundStore<StoreApi<SettingsStore>>) => Promise<MediaStream | null>,
    handleGetCamera: (username: string) => Promise<MediaStream | null>,
    muteMic: () => void;
    unmuteMic: () => void;
    turnOffMicrophone: () => void;
    turnOffCamera: () => void;
    handleUserUpdatedSettings: (msg: UserUpdatedSettings) => void;
    
}
export type IceCandidate = {
    IceCandidate: RTCIceCandidateInit,
}
const servers = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
        {
            urls: "turn:numb.viagenie.ca",
            username: "sj0016092@gmail.com",
            credential: "turnserver",
        }
    ],
};

export const useCurrentCallStore = create<CurrentCallStoreState>()(
    persist(
        (set, get) => ({
            chatterChannel: null,
            tabId: null,
            connection: "disconnected",
            makingOffer: false,
            loadingMyVideo: false,
            micThreshold: 15,
            hasMicPermission: false,
            hasCamPermission: false,
            pendingIceCandidates: [],

            // dont persist any of these in session storage (u cant persist a mediastream, or an audiocontext, peerConnection, etc.))
            audioTx: null,
            micStream: null,
            micSender: null,
            camStream: null,
            camSender: null,
            audioContext: null,
            remoteStreams: new Map(),
            peerConnection: null,
            monitorSpeakingIntervalIds: new Map(),
            focusedWindow: null,
            setFocusedWindow: (windowToBeFocused: QuickchatterWindow | null) => {
                set({ focusedWindow: windowToBeFocused });
            },
            setChatterChannel: (chatterChannel: ChatterChannel | null) => {
                set({ chatterChannel });
            },
            connectToCall: (channelName: string) => {
                chrome.runtime.sendMessage({
                    type: "connect-to-call",
                    channelName: channelName,
                });
            },
            reconnectToCall: (channelName: string) => {
                chrome.runtime.sendMessage({
                    type: "reconnect-to-call",
                    channelName: channelName,
                });
            },
            connectedToCall: (msg: ConnectedToCall, tabId: number) => {
                if (msg.ConnectedToCall.chatterChannel !== null) {
                    set({ chatterChannel: msg.ConnectedToCall.chatterChannel, tabId });
                }
                else if (msg.ConnectedToCall.connectedChatter !== null) {
                    let chatterChannel = get().chatterChannel;
                    let newChatterChannel = chatterChannel;
                    newChatterChannel?.chatters.push(msg.ConnectedToCall.connectedChatter);
                    set({ chatterChannel: newChatterChannel });
                }
            },
            disconnectedFromCall: async (msg: DisconnectedFromCall) => {
                let stopMonitoringSpeakers = get().stopMonitoringSpeakers;
                let audioContext = get().audioContext;
                let turnOffCam = get().turnOffCamera;
                let turnOffMicrophone = get().turnOffMicrophone;
                if (msg.DisconnectedFromCall.reason !== null) {
                    console.log('disconnected from call, reason: ', msg.DisconnectedFromCall.reason);
                    stopMonitoringSpeakers();
                    await audioContext?.close();
                    turnOffCam();
                    turnOffMicrophone();
                    set({
                        tabId: null,
                        chatterChannel: null,
                        connection: "disconnected",
                        audioContext: null,
                        audioTx: null,
                        monitorSpeakingIntervalIds: new Map(),
                        camSender: null,
                        camStream: null,
                        focusedWindow: null,
                        loadingMyVideo: false,
                        makingOffer: false,
                        micSender: null,
                        micStream: null,
                        peerConnection: null,
                        remoteStreams: new Map(),
                    });
                }
                else if (msg.DisconnectedFromCall.disconnectedChatter) {
                    let chatterChannel = get().chatterChannel;
                    if (chatterChannel) {
                        let newChatters = chatterChannel.chatters.filter(chatter => chatter.sessionId !== msg.DisconnectedFromCall.disconnectedChatter?.sessionId);

                        set({ chatterChannel: { ...chatterChannel, chatters: newChatters } });
                    }
                }
            },
            disconnectFromCall: () => {
                chrome.runtime.sendMessage({
                    type: "disconnect-from-call",
                });
            },
            startPeerConnection: async () => {
                let peerConnection = new RTCPeerConnection(servers);
                let audioTx = peerConnection.addTransceiver("audio");
                let audioContext = new AudioContext();
                set({
                    peerConnection,
                    connection: peerConnection.iceConnectionState,
                    remoteStreams: new Map(),
                    monitorSpeakingIntervalIds: new Map(),
                    audioContext,
                    audioTx,
                });
                peerConnection.oniceconnectionstatechange = () => {
                    // handleICEConnectionStateChangeEvent(sessionId, socket);
                    let micStream = get().micStream;
                    let camStream = get().camStream;

                    let handleCreateOffer = get().handleCreateOffer;
                    if (peerConnection) {
                        console.log(peerConnection.iceConnectionState);
                        if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
                            // retry in x amount of seconds instead of this if disonnected and not failed?
                            //await handleCreateOffer(sessionId, socket)
                            micStream?.getTracks().forEach(track => {
                                track.stop();
                            });
                            camStream?.getTracks().forEach(track => {
                                track.stop();
                            });
                            peerConnection.close();
                        }
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
                    console.log('ONTRACK HAPPENED: ', track, streams);
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
                            let newRemoteStreams = remoteStreams;
                            if (newRemoteStreams.has(username)) {
                                let newRemoteStream = newRemoteStreams.get(username);
                                if (newRemoteStream !== undefined) {
                                    newRemoteStream.addTrack(track);
                                    newRemoteStreams.set(username, newRemoteStream);
                                    set({ remoteStreams: newRemoteStreams });
                                }
                            }
                            else {
                                newRemoteStreams.set(username, stream);
                                set({ remoteStreams: newRemoteStreams });
                            }
                        }
                    }
                    if (type === "audio") {
                        monitorSpeaking(username, stream, isSpeaking => {
                            if (isSpeaking) {
                                // get chatter_camera_on and chatter_camera_off with id of said person
                                // if theres a chatter_camera_on, highlight that
                                // else, highlight chatter camera off
                                console.log('THEYRE SPEAKING');
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
                peerConnection.onnegotiationneeded = () => {
                    console.log('ON NEGOTIATION NEEDED HHAPPENED');
                    // handleNegotiationNeededEvent(sessionId, socket)
                    let handleCreateOffer = get().handleCreateOffer;
                    // TODO!() maybe needs to be awaited
                    handleCreateOffer();
                }
                peerConnection.onconnectionstatechange = () => {
                }
                peerConnection.onicecandidateerror = () => {
                }
            },
            handleIceCandidateFromServer: async (message: IceCandidate) => {
                let peerConnection = get().peerConnection;
                let pendingIceCandidates = get().pendingIceCandidates;
                if (peerConnection) {
                    if (peerConnection.remoteDescription !== null) {
                        console.log('my peer conns remote desc isnt null. ');
                        await peerConnection?.addIceCandidate(message.IceCandidate);
                    }
                    else {
                        set({ pendingIceCandidates: [...pendingIceCandidates, message.IceCandidate]});
                        console.log('my peer conns null. no addicecand.');
                    }
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
                    console.log('handlecreateoffer error: ', err);
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
                        let chatterChannel = get().chatterChannel;
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
                    console.log('problem handling answer from server: ', err);
                }
            },
            handleOfferFromServer: async (message: OfferFromServer) => {
                let peerConnection = get().peerConnection;
                let makingOffer = get().makingOffer;

                let msgSdp: RTCSessionDescriptionInit = message.OfferFromServer;
                const offerCollision = msgSdp.type === "offer" && 
                    (makingOffer || peerConnection?.signalingState !== "stable");

                // i am impolite peer, so if there is one, ignore it
                if (offerCollision) {
                    return;
                }
                try {
                    await peerConnection?.setRemoteDescription(msgSdp);
                }
                catch (err) {
                    console.log('problem handling offer from server:', err);
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

                console.log('audio context is: ', audioContext);
                if (audioContext) {
                    console.log('audio context is: ', audioContext);
                    const source = audioContext.createMediaStreamSource(stream);
                    console.log('audio context is: ', audioContext);
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
                    if (audioTx && audioTx.sender) {
                        audioTx.sender.replaceTrack(destNode.stream.getAudioTracks()[0]);
                    }
                    else {
                        peerConnection?.addTrack(destNode.stream.getAudioTracks()[0]);
                    }
                    console.log('setting hasmicpermission to true!');
                    set({ hasMicPermission: true, micStream: destNode.stream });
                    applyMicSettings();
                }
                else {
                    console.log('THERE IS NO AUDIO CONTEXT.');
                }
            },
            handleGetMicrophone: async (username: string, settingsStore: UseBoundStore<StoreApi<SettingsStore>>) => {
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
                    console.log('problem getting mic:', err);
                    set({ hasMicPermission: false });
                    return null;
                }
            },
            handleGetCamera: async (username: string) => {
                let peerConnection = get().peerConnection;
                let camSender = get().camSender;
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
                    if (camSender !== null) {
                        camSender.replaceTrack(camStream.getVideoTracks()[0]);
                    }
                    else {
                        if (peerConnection) {
                            camSender = peerConnection.addTrack(camStream.getVideoTracks()[0], camStream);
                        }
                    }
                    set({ hasCamPermission: true, camStream, camSender });
                    let videoElement: HTMLVideoElement | null | undefined = document.querySelector('#browsem-host')?.shadowRoot?.querySelector(`#${username}_video`);
                    console.log(videoElement);
                    if (videoElement) {
                        videoElement.srcObject = camStream;
                    }
                    return camStream;
                }
                catch (err) {
                    console.log('problem getting camera: ', err);
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
                let camSender = get().camSender;

                if (camStream && camStream.getVideoTracks()[0]) {
                    let track = camStream.getVideoTracks()[0];
                    track.stop();
                    camStream.removeTrack(track);
                    camSender?.replaceTrack(null);
                }
                set({ camStream: null, camSender, peerConnection, hasCamPermission: false });
            },
            turnOffMicrophone: () => {
                let micStream = get().micStream;
                let peerConnection = get().peerConnection;
                let micSender = get().micSender;
                
                if (micStream && micStream.getAudioTracks()[0]) {
                    micStream.getAudioTracks().forEach(track => {
                        track.stop();
                        micStream?.removeTrack(track);
                        micSender?.replaceTrack(null);
                    })
                }
                set({ micStream: null, micSender, peerConnection, hasMicPermission: false, });
            },
            handleUserUpdatedSettings: (msg: UserUpdatedSettings) => {
                // update in currentCall.chatters
                let chatterChannel = get().chatterChannel;
                if (msg.UserUpdatedSettings.callSessionId === chatterChannel?.sessionId) {
                    let newChatterChannel = chatterChannel;
                    newChatterChannel.chatters = newChatterChannel.chatters.map(chatter => {
                        if (chatter.username === msg.UserUpdatedSettings.username) {
                            let newChatter: Chatter = {
                                ...chatter,
                                username: msg.UserUpdatedSettings.username,
                                settings: msg.UserUpdatedSettings.settings,
                            };
                            return newChatter
                        }
                        return chatter;
                    });
                    set({ chatterChannel: newChatterChannel });
                }
            }
        }),
        {
            name: "current-call-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage),
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['audioTx', 'micStream', 'micSender', 'camStream', 'camSender', 'audioContext', 'remoteStreams', 'peerConnection', 'monitorSpeakingIntervalIds', 'focusedWindow'].includes(key))
                )

        }
    )
);
