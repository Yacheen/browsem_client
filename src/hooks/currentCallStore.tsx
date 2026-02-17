// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
import { ChatterChannel } from '@/components/Channels';
import { Chatter } from './ChannelsStore';
import { AnswerFromClient, AnswerFromServer, ConnectedToCall, DisconnectedFromCall, OfferFromClient, OfferFromServer } from '@/popup/App';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChromeSessionStorage } from 'zustand-chrome-storage';

interface CurrentCallStoreState {
    chatterChannel: ChatterChannel | null,
    tabId: number | null,
    peerConnection: RTCPeerConnection | null,
    remoteStreams: Map<string, MediaStream>,
    connection: RTCIceConnectionState,
    monitorSpeakingIntervalIds: Map<string, number>,
    makingOffer: boolean,
    focusedWindow: null,
    loadingMyVideo: boolean,
    micStream: MediaStream | null,
    camStream: MediaStream | null,
    micSender: RTCRtpSender | null,
    camSender: RTCRtpSender | null,
    audioContext: AudioContext | null,
    micThreshold: number,
    audioTx: RTCRtpTransceiver | null,
    setFocusedWindow: (chatterWindow: null) => void,
    setChatterChannel: (chatterChannel: ChatterChannel | null) => void,
    connectToCall: (channelName: string) => void,
    connectedToCall: (msg: ConnectedToCall, tabId: number) => void,
    reconnectToCall: (channelName: string) => void,
    disconnectedFromCall: (msg: DisconnectedFromCall) => void,
    disconnectFromCall: () => void,
    startPeerConnection: () => Promise<void>,
    handleIceCandidateFromServer: (message: IceCandidate) => Promise<void>,
    handleCreateOffer: () => Promise<void>,
    monitorSpeaking: (username: string, stream: MediaStream, onSpeakingChange: (isSpeaking: boolean) => void) => void,
    handleAnswerFromServer: (message: AnswerFromServer) => void,
    handleOfferFromServer: (message: OfferFromServer) => Promise<void>,
    stopMonitoringSpeakers: () => void
}
export type IceCandidate = {
    IceCandidate: RTCIceCandidateInit,
}
const servers = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};

export const useCurrentCallStore = create<CurrentCallStoreState>()(
    persist(
        (set, get) => ({
            chatterChannel: null,
            tabId: null,
            focusedWindow: null,
            remoteStreams: new Map(),
            peerConnection: null,
            connection: "disconnected",
            monitorSpeakingIntervalIds: new Map(),
            makingOffer: false,
            loadingMyVideo: false,
            micStream: null,
            micSender: null,
            camStream: null,
            camSender: null,
            audioContext: null,
            micThreshold: 15,
            audioTx: null,
            setFocusedWindow: () => {},
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
                if (msg.DisconnectedFromCall.reason !== null) {
                    console.log('disconnected from call, reason: ', msg.DisconnectedFromCall.reason);
                    stopMonitoringSpeakers();
                    await audioContext?.close();
                    set({
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
                                let chatterCameraOnElement = document.getElementById(`chatter_camera_on_${username}`);
                                let chatterCameraOffElement = document.getElementById(`chatter_camera_off_${username}`);
                                if (chatterCameraOnElement !== null) {
                                    chatterCameraOnElement.classList.add('speaking_border');
                                }
                                else if (chatterCameraOffElement !== null) {
                                    chatterCameraOffElement.classList.add('speaking_border');
                                }
                            }
                            else {
                                let chatterCameraOnElement = document.getElementById(`chatter_camera_on_${username}`);
                                let chatterCameraOffElement = document.getElementById(`chatter_camera_off_${username}`);
                                if (chatterCameraOnElement !== null) {
                                    chatterCameraOnElement.classList.remove('speaking_border');
                                }
                                else if (chatterCameraOffElement !== null) {
                                    chatterCameraOffElement.classList.remove('speaking_border');
                                }
                            }
                        })
                    }
                    track.onunmute = () => {
                        if (type === "audio") {
                            track.enabled = true;
                            let audio: HTMLAudioElement | null = document.querySelector(`#${username}_audio`);
                            if (audio !== null) {
                                audio.srcObject = stream;
                            }
                        }
                        if (type === "video") {
                            let videoElement: HTMLVideoElement | null = document.querySelector(`#${username}_video`);
                            if (videoElement !== null) {
                                videoElement.srcObject = stream;
                            }
                        }
                    }
                    track.onmute = () => {
                        if (type === "audio") {
                        } 
                        if (type === "video") {
                            let videoElement: HTMLVideoElement | null = document.querySelector(`#${username}_video`);
                            if (videoElement !== null) {
                                videoElement.srcObject = null;
                            }
                        }
                    }
                    // track.onended = () => {}
                    // stream.onaddtrack = () => {}
                    // stream.onremovetrack = () => {}
                }
                peerConnection.onnegotiationneeded = () => {
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
                if (peerConnection?.remoteDescription !== null) {
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
            handleAnswerFromServer: (message: AnswerFromServer) => {
                let peerConnection = get().peerConnection;
                try {
                    peerConnection?.setRemoteDescription(message.AnswerFromServer);
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
        }),
        {
            name: "current-call-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
