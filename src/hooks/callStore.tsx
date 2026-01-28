// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
type Chatter = {
    username: string,
    session_id: string,
    pfp_s3_key?: string,
}

interface CallStoreState {
    chatters: Chatter,
    remoteStreams: ,
}

export const useCallStore = create<CallStoreState>()(
    (set, get) => ({

    }),
);
