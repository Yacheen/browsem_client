// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
import { ChatterChannel } from '@/components/Channels';
import { Chatter } from './ChannelsStore';
import { ConnectedToCall, DisconnectedFromCall } from '@/popup/App';
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
    handleCreateOffer: (sessionId: string) => Promise<void>,
}
export type IceCandidate = {
    iceCandidate: {
        candidate: string;
        sdpMid: string | null;
        sdpMlineIndex: number | null;
        usernameFragment: string | null;
    }
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
            disconnectedFromCall: (msg: DisconnectedFromCall) => {
                if (msg.DisconnectedFromCall.reason !== null) {
                    console.log('disconnected from call, reason: ', msg.DisconnectedFromCall.reason);
                    set({ chatterChannel: null });
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
                            iceCandidate: {
                                candidate: event.candidate.candidate,
                                sdpMid: event.candidate.sdpMid,
                                sdpMlineIndex: event.candidate.sdpMLineIndex,
                                usernameFragment: event.candidate.usernameFragment,
                            }
                        };
                        chrome.runtime.sendMessage({
                            type: "ice-candidate",
                            iceCandidate: JSON.stringify(iceCandidate),
                        })
                    }
                }
                peerConnection.ontrack = ({ track, streams }) => {
                    // handleTrackEvent(track, streams);
                }
                peerConnection.onnegotiationneeded = () => {
                    // handleNegotiationNeededEvent(sessionId, socket)
                }
                peerConnection.onconnectionstatechange = () => {
                }
                peerConnection.onicecandidateerror = () => {
                }
            },
            handleCreateOffer: async (sessionId: string) => {
                let peerConnection = get().peerConnection;
                try {
                    set({ makingOffer: true });
                    if (peerConnection) {
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        chrome.runtime.sendMessage({
                            type: "create-offer",
                            sdp: JSON.stringify(peerConnection.localDescription)
                        });
                    }
                }
                catch (err) {
                    console.log('handlecreateoffer error: ', err);
                }
                finally {
                    set({ makingOffer: false });
                }
            }
        }),
        {
            name: "current-call-session-storage",
            storage: createJSONStorage(() => ChromeSessionStorage)
        }
    )
);
