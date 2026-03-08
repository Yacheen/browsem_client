import React, { useEffect, useRef, useState, useContext } from "react";
import styles from './VolumeController.module.scss';
import { Tooltip } from "@mui/material";
import VolumeUpTwoToneIcon from '@mui/icons-material/VolumeUpTwoTone';
import { CircularProgress } from "@mui/material";
import VolumeOffTwoToneIcon from '@mui/icons-material/VolumeOffTwoTone';
import { useBrowsemStore } from "@/hooks/browsemStore";
import { useVolumeStore } from "@/hooks/volumeStore";
import "./VolumeController.scss";

export default function VolumeController() {
    const browsemStore = useBrowsemStore();
    const volume = useVolumeStore(state => state.volume);
    const setVolume = useVolumeStore(state => state.setVolume);

    // const [mounted, setMounted] = useState<boolean>(false);
    // useEffect(() => {
    //     setMounted(true);
    // }, []);
    // if (!mounted) {
    //     return <CircularProgress />;
    // }
    const handleSetSfxVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(event.currentTarget.valueAsNumber);
    }
    const handleSfxMouseUp = async () => {
        await chrome.runtime.sendMessage({
            type: "play-sound",
            action: "play",
            path: "src/assets/sounds/deafen_false.wav",
        });
    }

    return (
        <div className="sfx-container">
            {
                volume === null || volume === undefined
                ?
                    <CircularProgress />
                :
                    <>
                        <div className="sfx-header-container">
                            <VolumeUpTwoToneIcon className="input-icon" /> 
                            <h4>Sound FX</h4>
                        </div>
                        <Tooltip
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        fontSize: 16,
                                    }
                                }
                            }}
                            arrow disableInteractive placement="left" title={`${volume}%`} >
                            <input
                                onMouseUp={handleSfxMouseUp}
                                onChange={handleSetSfxVolume}
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                className="sfx-input-slider"
                            />
                        </Tooltip>
                    </>
            }
        </div>
    )
}
