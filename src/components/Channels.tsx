import { useBrowsemStore } from '@/hooks/browsemStore';
import { SetStateAction, useEffect, useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Tooltip from '@mui/material/Tooltip';
import "./Channels.scss";
import { useChannelsStore } from '@/hooks/ChannelsStore';
import { getDomainName, shortenStringWithDots } from '@/utils/functions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PersonIcon from '@mui/icons-material/Person';
import { useCurrentCallStore } from '@/hooks/currentCallStore';
import pfpPath from "../assets/chatter_default_pfp.png";
const defaultPfp = chrome.runtime.getURL(pfpPath);
// mic
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
// video
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
// deafened
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import HeadsetIcon from '@mui/icons-material/Headset';
// screenshere
import MonitorIcon from '@mui/icons-material/Monitor';
import { Chatter, UrlCalls } from '@/utils/types';
// ban
import BlockIcon from '@mui/icons-material/Block';
// kick
import ClearIcon from '@mui/icons-material/Clear';

type ChannelsProps = {
    urlForRenderingDomains: string | undefined,
    currentUrlDropdown: string[],
    setCurrentUrlDropdown: React.Dispatch<SetStateAction<string[]>>,
}
export default function Channels({ urlForRenderingDomains, currentUrlDropdown, setCurrentUrlDropdown }: ChannelsProps) {
    const yourCurrentUrl = useBrowsemStore(state => state.currentUrl);
    const currentChannel = useBrowsemStore(state => state.chatterChannel);
    const urlCalls = useChannelsStore(state => state.urlCalls);
    const yourUsername = useBrowsemStore(state => state.username);
    const [textColor, setTextColor] = useState<'hsl(0, 0%, 10%)' | 'hsl(0, 0%, 95%)'>(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
            return 'hsl(0, 0%, 95%)'
        }
        else {
            return 'hsl(0, 0%, 10%)'
        }
    });
    const [bgColor, setBgColor] = useState<'hsl(0, 0%, 15%)' | 'hsl(0, 0%, 90%)'>(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
            return 'hsl(0, 0%, 15%)'
        }
        else {
            return 'hsl(0, 0%, 90%)'
        }
    });

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
      return  decodeURIComponent(newUrl.pathname + newUrl.search + newUrl.hash);
  }
  const handleConnectToCall = (channelName: string, urlName: String) => {
    chrome.runtime.sendMessage({
        type: "connect-to-call",
        channelName: channelName,
        urlName:  urlName,
    });
  }
  const handleKickChatter = (recipientUsername: string, channelName: string, urlName: string, urlOrigin: string) => {
      chrome.runtime.sendMessage({
          type: 'kick-chatter',
          username: recipientUsername,
          channelName: channelName,
          urlName: urlName,
          urlOrigin: urlOrigin,
      });
  };
  const handleBanChatter = (recipientUsername: string, channelName: string, urlName: string, urlOrigin: string) => {
      chrome.runtime.sendMessage({
          type: 'ban-chatter',
          username: recipientUsername,
          channelName: channelName,
          urlName: urlName,
          urlOrigin: urlOrigin,
      });
  };

  return (
        <div className="url-calls-container">
            {
                // only use currentChannel.fullUrl if ur in a call and this rendering of channels is in the currentCall
                urlCalls.filter(urlCall => getDomainName(urlCall.urlName) === getDomainName(urlForRenderingDomains ?? yourCurrentUrl)).map(urlCall => (
                    <>
                        <div title={urlCall.urlName} onClick={() => handleSetCurrentUrlDropdown(urlCall.urlName)} className="url-call-container" key={urlCall.urlName}>
                            <p className={`url-call-name ${getUrlNameForUrlCall(urlCall.urlName) === "/" ? 'homepage-text' : ''}`}>{getUrlNameForUrlCall(urlCall.urlName) === "/" ? "/homepage" : getUrlNameForUrlCall(urlCall.urlName)}</p>
                            <div className="url-call-right">
                                <div className={`${getUrlNameForUrlCall(urlCall.urlName) === "/" ? 'homepage-text' : ''} url-call-channel-count`}>{urlCall.channels.length}</div>
                                <div className="url-call-dropped-down-icon-container">
                                    {
                                        currentUrlDropdown.find(urlDroppeddown => urlDroppeddown === urlCall.urlName)
                                        ?
                                            <KeyboardArrowDownIcon className="url-call-dropped-down-icon" />
                                        :
                                            <KeyboardArrowRightIcon className="url-call-dropped-down-icon" />
                                    }
                                </div>
                            </div>
                        </div>     
                        {
                            currentUrlDropdown.find(urlDroppeddown => urlDroppeddown === urlCall.urlName)
                            ?
                                null
                            :
                                <div className="channels-container"> 
                                    {
                                        urlCall.channels.map(channel => (
                                            <div key={channel.sessionId} className="channel">
                                                <Tooltip placement='top' title="Join" arrow disableInteractive slotProps={{
                                                    popper: {
                                                        disablePortal: true,
                                                        style: {
                                                            zIndex: 6942013383,
                                                        }
                                                    },
                                                    tooltip: {
                                                        className: "light-tooltip dark-tooltip",
                                                    },
                                                    arrow: {
                                                        className: "light-tooltip-arrow dark-tooltip-arrow"
                                                    }
                                                }}>
                                                    <div onClick={() => handleConnectToCall(channel.channelName, channel.fullUrl)} className="channel-meta">
                                                        <div className="channel-meta-left">
                                                            <div className="channel-voice-icon">
                                                                <VolumeUpIcon className="channel-icon" />
                                                            </div>
                                                            <p title={channel.channelName} className="channel-name">{decodeURIComponent(shortenStringWithDots(channel.channelName, 25))}</p>
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
                                                                {
                                                                    yourUsername == channel.channelOwner && chatter.username !== yourUsername
                                                                    ?
                                                                        <div className="channel-chatter-kick-or-ban">
                                                                            <Tooltip placement='top' title="Kick" arrow disableInteractive slotProps={{
                                                                                tooltip: {
                                                                                    className: "light-tooltip dark-tooltip"
                                                                                },
                                                                                popper: {
                                                                                    disablePortal: true,
                                                                                    style: {
                                                                                        zIndex: 6942013383,
                                                                                    }
                                                                                },
                                                                                arrow: {
                                                                                    className: "light-tooltip-arrow dark-tooltip-arrow",
                                                                                }
                                                                            }}>
                                                                                <div onClick={() => handleKickChatter(chatter.username, channel.channelName, channel.fullUrl, channel.urlOrigin)} className="channel-chatter-kick-icon-container">
                                                                                    <ClearIcon />
                                                                                </div>
                                                                            </Tooltip>
                                                                            <Tooltip placement='top' title="Ban" arrow disableInteractive slotProps={{
                                                                                tooltip: {
                                                                                    className: "light-tooltip dark-tooltip"
                                                                                },
                                                                                popper: {
                                                                                    disablePortal: true,
                                                                                    style: {
                                                                                        zIndex: 6942013383,
                                                                                    }
                                                                                },
                                                                                arrow: {
                                                                                    className: "light-tooltip-arrow dark-tooltip-arrow",
                                                                                }
                                                                            }}>
                                                                                <div onClick={() => handleBanChatter(chatter.username, channel.channelName, channel.fullUrl, channel.urlOrigin)} className="channel-chatter-ban-icon-container">
                                                                                    <BlockIcon />
                                                                                </div>
                                                                            </Tooltip>
                                                                        </div>
                                                                    :
                                                                        null
                                                                }
                                                                <div className="channel-chatter-right">
                                                                    <div className="channel-chatter-meta">
                                                                        <img src={defaultPfp} alt="pfp" />
                                                                        <p>{chatter.username}</p>
                                                                    </div>
                                                                    <div className="chatter-settings-icon-container">
                                                                        {chatter.settings.microphoneIsOn ? null : <MicOffIcon />}
                                                                    </div>
                                                                    <div className="chatter-settings-icon-container">
                                                                        {chatter.settings.deafened ? <HeadsetOffIcon /> : null}
                                                                    </div>
                                                                    <div className="chatter-settings-icon-container">
                                                                        {chatter.settings.cameraIsOn ? <VideocamIcon /> : null}
                                                                    </div>
                                                                    <div className="chatter-settings-icon-container">
                                                                        {chatter.settings.sharingScreen ? <MonitorIcon /> : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                        }
                    </>
                ))
            }
        </div>
  )
}
