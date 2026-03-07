// typeguard fns
export const isConnected = (msg: ClientMessage): msg is Connected => {
    return (msg as Connected).Connected !== undefined;
};
export const isDisconnected = (msg: ClientMessage): msg is Disconnected => {
    return (msg as Disconnected).Disconnected !== undefined;
};
export const isErrorMessage = (msg: ClientMessage): msg is ErrorMessage => {
    return (msg as ErrorMessage).ErrorMessage !== undefined;
};
export const isNoChannelName = (msg: ErrorType): msg is NoChannelName => {
    return (msg as NoChannelName).NoChannelName !== undefined;
};
export const isChannelNameTooLong = (msg: ErrorType): msg is ChannelNameTooLong => {
    return (msg as ChannelNameTooLong).ChannelNameTooLong !== undefined;
};
export const isChannelNameExists = (msg: ErrorType): msg is ChannelNameExists => {
    return (msg as ChannelNameExists).ChannelNameExists !== undefined;
};
export const isBannedFromChannel = (msg: ErrorType): msg is BannedFromChannel => {
    return (msg as BannedFromChannel).BannedFromChannel !== undefined;
};
export const isChannelMessageTooLong = (msg: ErrorType): msg is ChannelMessageTooLong => {
    return (msg as ChannelMessageTooLong).ChannelMessageTooLong !== undefined;
};
export const isChannelCreated = (msg: ClientMessage): msg is ChannelCreated => {
    return (msg as ChannelCreated).ChannelCreated !== undefined;
};
export const isBrowsemStats = (msg: ClientMessage): msg is BrowsemStats => {
    return (msg as BrowsemStats).BrowsemStats !== undefined;
};
export const isUrlsUpdated = (msg: ClientMessage): msg is UrlsUpdated => {
    return (msg as UrlsUpdated).UrlsUpdated !== undefined;
};
export const isOriginCalls = (msg: ClientMessage): msg is OriginCalls => {
    return (msg as OriginCalls).OriginCalls !== undefined;
};

export const isConnectedToCall = (msg: ClientMessage): msg is ConnectedToCall => {
    return (msg as ConnectedToCall).ConnectedToCall !== undefined;
};
export const isDisconnectedFromCall = (msg: ClientMessage): msg is DisconnectedFromCall => {
    return (msg as DisconnectedFromCall).DisconnectedFromCall !== undefined;
};
export const isAnswerFromServer = (msg: ClientMessage): msg is AnswerFromServer => {
    return (msg as AnswerFromServer).AnswerFromServer !== undefined;
};
export const isOfferFromServer = (msg: ClientMessage): msg is OfferFromServer => {
    return (msg as OfferFromServer).OfferFromServer !== undefined;
};
export const isIceCandidate = (message: any): message is IceCandidate => {
    return (message as IceCandidate).IceCandidate !== undefined;
}
export const isUserUpdatedSettings = (message: any): message is UserUpdatedSettings => {
    return (message as UserUpdatedSettings).UserUpdatedSettings !== undefined;
}
export const isReconnectedToCall = (message: any): message is ReconnectedToCall => {
    return (message as ReconnectedToCall).ReconnectedToCall !== undefined;
}
export const isChannelMessageSent = (message: any): message is ChannelMessageSent => {
    return (message as ChannelMessageSent).ChannelMessageSent !== undefined;
}
export type IceCandidate = {
    IceCandidate: RTCIceCandidateInit,
}
// types
export type BackgroundMessage = {
    // this type field is used exclusively for sending messages back and forth for
    // the background script and thats it, I think.
    // any different "types" of msgs will be checked with a typeguard in clientmessage
    type: MessageType,
    contents: ClientMessage
}
export type MessageType = "offer-from-server" | "answer-from-server";
export type ClientMessage = Disconnected | Connected | ErrorMessage | ChannelCreated | BrowsemStats | OriginCalls | UrlsUpdated | ConnectedToCall | DisconnectedFromCall | AnswerFromServer | OfferFromServer | IceCandidate | UserUpdatedSettings;

// general messages
export type BrowsemStats = {
    BrowsemStats: {
        sessionsOnline: number,
        sessionsInYourOrigin: number,
        sessionsInYourUrl: number
    }
}
export type ChannelCreated = {
    ChannelCreated: UrlCalls,
};
export type Connected = {
    Connected: {
        sessionId: string,
        sessionsOnline: number,
    }
};
export type Disconnected = {
    Disconnected: {
        reason: string
    }
};
// errors
export type ErrorMessage = {
    ErrorMessage: ErrorType
};
export type ErrorType = NoChannelName | ChannelNameTooLong | ChannelNameExists | BannedFromChannel | ChannelMessageTooLong;

export type ChannelMessageTooLong = {
    ChannelMessageTooLong: string,
}
export type ChannelNameExists = {
    ChannelNameExists: string,
};
export type NoChannelName = {
    NoChannelName: string,
};
export type ChannelNameTooLong = {
    ChannelNameTooLong: string,
};
export type BannedFromChannel = {
    BannedFromChannel: string,
}
export type OriginCalls = {
    OriginCalls: {
        urls: UrlCalls[],
    }
}
export type Settings = {
    microphoneIsOn: boolean,
    cameraIsOn: boolean,
    sharingScreen: boolean,
    deafened: boolean,
}
export type ChannelMessage = {
    chatter: Chatter,
    message: string
    timestamp: number,
};
export type ChannelMessageSent = {
    ChannelMessageSent: {
        message: ChannelMessage,
        channelSessionId: string,
        urlOrigin: string,
        urlName: string,
    }
};
export type Chatter = {
    username: string,
    sessionId: string,
    pfpS3Key?: string,
    settings: Settings,
}
export type ChatterChannel = {
    sessionId: string,
    channelName: string,
    channelOwner: string,
    chatters: Chatter[],
    urlOrigin: string,
    fullUrl: string,
    maxChatters: number,
    channelMessages: ChannelMessage[],
};
export type UrlCalls = {
    urlName: string,
    channels: ChatterChannel[],
}
export type UrlsUpdated = {
    UrlsUpdated: string,
}
 // ConnectedToCall | DisconnectedFromCall | AnswerFromServer | OfferFromServer
export type ConnectedToCall = {
    ConnectedToCall: {
        connectedChatter: Chatter,
        channelName: string ,
        channelSessionId: string,
        urlName: string,
        urlOrigin: string,
    }
}
export type DisconnectedFromCall = {
    DisconnectedFromCall: {
        disconnectedChatter: Chatter,
        channelName: string,
        urlName: string,
        reason: string,
        // joiningAnotherCall
    } 
}
export type AnswerFromServer = {
    AnswerFromServer: RTCSessionDescription 
}
export type OfferFromServer = {
    OfferFromServer: RTCSessionDescription 
}
export type OfferFromClient = {
    OfferFromClient: RTCSessionDescription 
}
export type AnswerFromClient = {
    AnswerFromClient: RTCSessionDescription 
}
export type UserUpdatedSettings = {
    UserUpdatedSettings: {
        settings: Settings,
        // SESSIONS ID, NOT CALL NAME
        currentCall: string,
        username: string,
        callSessionId: string,
    }
}
export type ReconnectedToCall = {
    ReconnectedToCall: {
        connectedChatter: Chatter,
        urlOrigin: string,
        urlName: string,
        channelSessionId: string,
        chatterChannel: ChatterChannel,
    }
}
