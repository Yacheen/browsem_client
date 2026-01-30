import { useBrowsemStore } from '@/hooks/browsemStore';
import { Chatter } from '@/hooks/callStore';
import { useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import "./Channels.css";
export type Channel = {
    channelName: string,
    chatters: Chatter[]
}

export default function Channels(props: { channels: Channel[] }) {
  const browsemStore = useBrowsemStore();

  return (
      <div className="channels-container"> 
        {
            props.channels.map(channel => (
                <div className="channel">
                    <div className="channel-meta">
                        <div className="channel-voice-icon">
                            <VolumeUpIcon />
                        </div>
                        <p>{channel.channelName}</p>
                    </div>
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
