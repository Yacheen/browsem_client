import { useBrowsemStore } from '@/hooks/browsemStore';
import { Chatter } from '@/hooks/callStore';
import { useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Tooltip from '@mui/material/Tooltip';
import "./Channels.css";
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { shortenStringWithDots } from '@/utils/functions';
export type ChatterChannel = {
    sessionId: string,
    channelName: string,
    channelOwner: string,
    chatters: Chatter[],
    urlOrigin: string,
    fullUrl: string,
    maxChatters: number,
};

export default function Channels() {
  const browsemStore = useBrowsemStore();
  const channelsStore = useChannelsStore();

  return (
      <div className="channels-container"> 

      </div>
  )
}
