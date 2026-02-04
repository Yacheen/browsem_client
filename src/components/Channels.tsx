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
        {
            channelsStore.channels.map(channel => (
                <div key={channel.sessionId} className="channel">
                    <Tooltip placement='top' title="Join" arrow disableInteractive slotProps={{
                        // popper: {
                        //     modifiers: [
                        //         {
                        //             name: 'offset',
                        //             options: {
                        //                 offset: [25, -10]
                        //             }
                        //         }
                        //     ]
                        // }
                    }}>
                        <div className="channel-meta">
                            <div className="channel-meta-left">
                                <div className="channel-voice-icon">
                                    <VolumeUpIcon className="channel-icon" />
                                </div>
                                <p title={channel.channelName} className="channel-name">{shortenStringWithDots(channel.channelName, 25)}</p>
                            </div>
                            <div className="channel-max-chatters">
                                {channel.chatters.length}/{channel.maxChatters}
                            </div>
                        </div>
                    </Tooltip>
                    <div className="channel-chatters">
                        {
                            channel.chatters.map(chatter => (
                                <div className="channel-chatter">
                                    <img src={chatter.pfp_s3_key} alt="pfp" />
                                    <p>{chatter.username}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            ))
        }
      </div>
  )
}
