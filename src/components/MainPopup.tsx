import { useBrowsemStore } from '@/hooks/browsemStore';
import { useEffect, useState } from 'react'
import './MainPopup.css'
import Channels from './Channels';
import somePfp from "../../public/logo.png";
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import XIcon from '@mui/icons-material/X';
import TwitchIcon from '../assets/twitch_logo.svg';

export default function MainPopup() {
    const browsemStore = useBrowsemStore();
    const [currentUrl, setCurrentUrl] = useState<string>("");
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

    useEffect(() => {
        const getCurrentUrl = async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                let url = tabs[0].url;
                if (url) {
                    setCurrentUrl(url);
                }
                else {
                    setCurrentUrl("Could not get url...");
                }
            }
            catch (err) {
                console.log('problem getting tabs: ', err);
                setCurrentUrl(`Could not get url: ${err}`);
            }
        }
        if (chrome.tabs) {
            getCurrentUrl();
        }
    }, []);
    console.log(currentUrl);

    return (
        <>
            <div className="main-content">
                {/* logo for brand they are located */}
                <div className="where-am-i-header-container">
                    {
                        currentUrl.includes("https://www.youtube.com")
                        ?
                            <div className="brand-icon-container">
                                <YouTubeIcon fontSize='medium' className="brand-icon" />
                                <p>Youtube</p>
                            </div>
                        :
                        currentUrl.includes("https://www.twitch.tv")
                        ?
                            <div className="brand-icon-container">
                                <img src={TwitchIcon} className="brand-icon" />
                                <p>Twitch</p>
                            </div>
                        :
                        currentUrl.includes("https://www.reddit.com")
                        ?
                            <div className="brand-icon-container">
                                <RedditIcon fontSize='small' className="brand-icon" />
                                <p>Reddit</p>
                            </div>
                        :
                        (currentUrl.includes("https://x.com") || currentUrl.includes("https://twitter.com"))
                        ?
                            <div className="brand-icon-container">
                                <XIcon fontSize='small' className="brand-icon" />
                                <p>X</p>
                            </div>
                        :
                            <p className="read-the-docs where-am-i-text">Where am I?</p>
                    }
                </div>
                <input title={currentUrl} className="where-am-i-input" type="text" disabled value={currentUrl} />
                <div className="channels-and-buttons">
                    <Channels channels={[
                        {channelName: "poop", chatters: [
                            {session_id: "69420", username: "yassinnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", pfp_s3_key: somePfp },
                            {session_id: "69420", username: "alan", pfp_s3_key: somePfp },
                            {session_id: "69420", username: "chesney", pfp_s3_key: somePfp },
                            {session_id: "69420", username: "duncan", pfp_s3_key: somePfp },
                            {session_id: "69420", username: "paris", pfp_s3_key: somePfp },
                        ]},
                        {
                            channelName: "KoolKidsKlub",
                            chatters: [
                                {session_id: "69420", username: "yassin", pfp_s3_key: somePfp },
                                {session_id: "69420", username: "alan", pfp_s3_key: somePfp },
                            ]
                        }
                    ]} />
                    <div className="main-buttons">
                        <button className="new-button">New channel</button>
                    </div>
                </div>
            </div>
        </>
    )
}
