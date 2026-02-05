import { useBrowsemStore } from '@/hooks/browsemStore';
import { useEffect, useState } from 'react'
import './MainPopup.scss'
import Channels from './Channels';
import somePfp from "../../public/logo.png";
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import XIcon from '@mui/icons-material/X';
import twitchIcon from '../assets/twitch_logo.svg';
import kickIcon from '../assets/kick_logo.svg';
import { useCreatingChannelStore } from '@/hooks/CreatingChannelStore';
const channelsDummy = [
    {channelName: "blablablablablablablabla blablablablablablablabla blablablablablablablabla   ", chatters: [
        {session_id: "69420", username: "jeff", pfp_s3_key: somePfp },
    ]},
    {
        channelName: "KoolKidsKlub",
        chatters: [
            {session_id: "69420", username: "yassin", pfp_s3_key: somePfp },
            {session_id: "69420", username: "alan", pfp_s3_key: somePfp },
        ]
    },
    {channelName: "blablablablablablablabla blablablablablablablabla blablablablablablablabla   ", chatters: [
        {session_id: "69420", username: "jeff", pfp_s3_key: somePfp },
    ]},
    {channelName: "blablablablablablablabla blablablablablablablabla blablablablablablablabla   ", chatters: [
        {session_id: "69420", username: "jeff", pfp_s3_key: somePfp },
    ]},
    {channelName: "blablablablablablablabla blablablablablablablabla blablablablablablablabla   ", chatters: [
        {session_id: "69420", username: "jeff", pfp_s3_key: somePfp },
    ]},
    {channelName: "blablablablablablablabla blablablablablablablabla blablablablablablablabla   ", chatters: [
        {session_id: "69420", username: "jeff", pfp_s3_key: somePfp },
    ]},
];

export default function MainPopup() {
    const browsemStore = useBrowsemStore();
    const [error, setError] = useState<{ urlError: string }>({ urlError: "" });
    const [colorschemePreference, setColorschemePreference] = useState<'light' | 'dark'>(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
            return 'dark'
        }
        else {
            return 'light'
        }
    });

    const handleStartCreatingChannel = () => {
        browsemStore.setCurrentSelection("CreatingChannel");
    }

    useEffect(() => {
        const getCurrentUrl = async () => {
            try {
                // I need all urls, and the current active one
                // whenever popup opens, it'll change the current active one, however if in a call,
                // that call's info will remain the same and be a content script, 99% of the stuff
                // for the call will be within a content script

                const tabs = await chrome.tabs.query({ });

                let urls = tabs.map(tab => (tab.url as string));
                let urlOrigins = urls.map(url => new URL((url as string)).origin);
                let activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

                browsemStore.setUrlOriginsOpened(urlOrigins);
                browsemStore.setUrlsOpened(urls);

                if (activeTab[0]) {
                    let url = activeTab[0].url;
                    if (url) {
                        browsemStore.setCurrentUrl(url);
                    }
                    else {
                        browsemStore.setCurrentUrl("Could not get url...");
                    }
                }
            }
            catch (err) {
                console.log('problem getting tabs: ', err);
                browsemStore.setCurrentUrl(`Could not get url: ${err}`);
            }
        }
        if (chrome.tabs) {
            getCurrentUrl();
        }
    }, []);

    return (
        <>
            <div className="main-content">
                {/* logo for brand they are located */}
                <div className="where-am-i-header-container">
                    {
                        (browsemStore.currentUrl.includes("https://www.youtube.com") || browsemStore.currentUrl.includes("https://youtube.com") )
                        ?
                            <div className="brand-icon-container">
                                <YouTubeIcon fontSize='medium' className="brand-icon" />
                                <p>Youtube</p>
                            </div>
                        :
                        (browsemStore.currentUrl.includes("https://www.twitch.tv") || browsemStore.currentUrl.includes("https://twitch.tv"))
                        ?
                            <div className="brand-icon-container">
                                <img src={twitchIcon} alt="Twitch icon" className="brand-icon" />
                                <p>Twitch</p>
                            </div>
                        :
                        (browsemStore.currentUrl.includes("https://www.reddit.com") || browsemStore.currentUrl.includes("https://reddit.com"))
                        ?
                            <div className="brand-icon-container">
                                <RedditIcon fontSize='small' className="brand-icon" />
                                <p>Reddit</p>
                            </div>
                        :
                        (
                            (browsemStore.currentUrl.includes("https://x.com") || browsemStore.currentUrl.includes("https://twitter.com"))
                            ||
                            (browsemStore.currentUrl.includes("https://www.x.com") || browsemStore.currentUrl.includes("https://www.twitter.com"))
                        )
                        ?
                            <div className="brand-icon-container">
                                <XIcon fontSize='small' className="brand-icon" />
                                <p>X</p>
                            </div>
                        :
                        (browsemStore.currentUrl.includes("https://www.kick.com") || browsemStore.currentUrl.includes("https://kick.com"))
                        ?
                            <div className="brand-icon-container">
                                <img src={kickIcon} alt="Kick icon" className="brand-icon" />
                                <p>Kick</p>
                            </div>
                        :
                            <p className="read-the-docs where-am-i-text">Where am I?</p>
                    }
                </div>
                <input title={browsemStore.currentUrl} className="where-am-i-input" type="text" disabled value={browsemStore.currentUrl} />
                <div className="channels-and-buttons">
                    <Channels />
                    <div className="main-buttons">
                        <button onClick={handleStartCreatingChannel} className="new-channel-btn">New channel</button>
                    </div>
                </div>
            </div>
        </>
    )
}
