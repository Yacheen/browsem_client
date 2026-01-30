// for now manage state via storage (thats using zustand), and for content scripts just use another zustand store,
import { create } from 'zustand';
export type Chatter = {
    username: string,
    session_id: string,
    pfp_s3_key?: string,
}

interface CallStoreState {
    chatters: Chatter[],
    createdAt: number,
}

export const useCallStore = create<CallStoreState>()(
    () => ({
        chatters: [],
        createdAt: 0
    }),
);
