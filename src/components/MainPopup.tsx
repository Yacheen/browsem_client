import { useBrowsemStore } from '@/hooks/browsemStore';
import { useEffect, useState } from 'react'
import './MainPopup.css'

export default function MainPopup() {
    const browsemStore = useBrowsemStore();
    const [currentUrl, setCurrentUrl] = useState<string>("");
    const [error, setError] = useState<{ urlError: string }>({ urlError: "" });

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

    return (
        <>
            <div className="main-content">
                <p className="read-the-docs">Where am I?</p>
                {/* logo for brand they are located */}
                <img src="" alt="URL Brand image" />
                <div className="where-am-i-input-wrapper">
                    <input title={currentUrl} className="where-am-i-input" type="text" disabled value={currentUrl} />
                </div>
            </div>
        </>
    )
}
