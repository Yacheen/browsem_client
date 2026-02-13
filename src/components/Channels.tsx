import { useBrowsemStore } from '@/hooks/browsemStore';
import { useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Tooltip from '@mui/material/Tooltip';
import "./Channels.scss";
import { Chatter, useChannelsStore } from '@/hooks/ChannelsStore';
import { shortenStringWithDots } from '@/utils/functions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PersonIcon from '@mui/icons-material/Person';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import aniviaUltAsset from "../assets/aniviault.png";
const aniviaUlt = chrome.runtime.getURL(aniviaUltAsset);
export type ChatterChannel = {
    sessionId: string,
    channelName: string,
    channelOwner: string,
    chatters: Chatter[],
    urlOrigin: string,
    fullUrl: string,
    maxChatters: number,
    channelMessages: ChatMessage[],
};
export type ChatMessage = {
    chatter: Chatter,
    message: string
};

export default function Channels() {
  const browsemStore = useBrowsemStore();
  const channelsStore = useChannelsStore();
  const currentCallStore = useCurrentCallStore();
  const [currentUrlDropdown, setCurrentUrlDropdown] = useState<string[]>([]);

  const handleSetCurrentUrlDropdown = (urlName: string) => {
      let alreadyDroppedDown = currentUrlDropdown.find(urlDroppedDown => urlDroppedDown === urlName);
      if (alreadyDroppedDown) {
          let newCurrentUrlsDroppedDown = currentUrlDropdown.filter(urlDroppedDown => urlDroppedDown !== urlName);
          setCurrentUrlDropdown(newCurrentUrlsDroppedDown);
      }
      else {
          setCurrentUrlDropdown([...currentUrlDropdown, urlName]);
      }
  }
  const getUrlNameForUrlCall = (urlCall: string) => {
      let newUrl = new URL(urlCall);
      return newUrl.pathname + newUrl.search + newUrl.hash;
  }
  const handleConnectToCall = (channelName: string) => {
      currentCallStore.connectToCall(channelName);
  }

  return (
        <div className="url-calls-container">
            {
                channelsStore.urlCalls.map(urlCall => (
                    <>
                        <div onClick={() => handleSetCurrentUrlDropdown(urlCall.urlName)} className="url-call-container" key={urlCall.urlName}>
                            <p title={urlCall.urlName} className="url-call-name">{getUrlNameForUrlCall(urlCall.urlName)}</p>
                            <div className="url-call-right">
                                <div className="url-call-channel-count">{urlCall.channels.length}</div>
                                <div className="url-call-dropped-down-icon-container">
                                    {
                                        currentUrlDropdown.find(urlDroppeddown => urlDroppeddown === urlCall.urlName)
                                        ?
                                            <KeyboardArrowUpIcon className="url-call-dropped-down-icon" />
                                        :
                                            <KeyboardArrowDownIcon className="url-call-dropped-down-icon" />
                                    }
                                </div>
                            </div>
                        </div>     
                        {
                            currentUrlDropdown.find(urlDroppeddown => urlDroppeddown === urlCall.urlName)
                            ?
                                <div className="channels-container"> 
                                    {
                                        urlCall.channels.map(channel => (
                                            <div onClick={() => handleConnectToCall(channel.channelName)} key={channel.sessionId} className="channel">
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
                                                            {channel.chatters.length}/{channel.maxChatters} <div className="max-chatters-icon-container"><PersonIcon className="max-chatters-icon" /></div>
                                                        </div>
                                                    </div>
                                                </Tooltip>
                                                <div className="channel-chatters">
                                                    {
                                                        channel.chatters.map(chatter => (
                                                            <div className="channel-chatter">
                                                                <img src={aniviaUlt} alt="pfp" />
                                                                <p>{chatter.username}</p>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            :
                                null
                        }
                    </>
                ))
            }
        </div>
  )
}
