import { useEffect, useRef, useState } from 'react'
import './WindowHandler.scss'
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import VideoLabelTwoToneIcon from '@mui/icons-material/VideoLabelTwoTone';
import RemoveIcon from '@mui/icons-material/Remove';
import { Rnd } from 'react-rnd';
type WindowType = "BrowsemCall" | "Any";

export default function WindowHandler(props: {children: React.JSX.Element, closeMyWindow: () => void, description: string, type: WindowType, minWidth: number, minHeight: number }) {
    const [coords, setCoords] = useState<{ x: number, y: number }>({ x: 100, y: 100 });
    const [minimized, setMinimized] = useState<boolean>(false);
    const [initialDimensions, setInitialDimensions] = useState<{ width: number, height: number } | null>(null);
    const windowContentRef = useRef<HTMLDivElement>(null);
    const [resizing, setResizing] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const nodeRef = useRef<HTMLDivElement>(null);

    const handleMinimize = () => {
        setMinimized(!minimized);
    }
    const handleFullscreen = () => {

        setIsFullscreen(!isFullscreen);

    }
    const handleExitWindow = () => {
        props.closeMyWindow();
    }
        useEffect(() => {
        if (windowContentRef.current !== null && initialDimensions === null) {
            setInitialDimensions({width: windowContentRef.current?.offsetWidth, height: windowContentRef.current?.offsetHeight});
        }
    }, [windowContentRef])
    useEffect(() => {
        if (initialDimensions !== null) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentBoxSize) {
                        if (entry.borderBoxSize[0].blockSize !== initialDimensions?.height || entry.borderBoxSize[0].inlineSize !== initialDimensions.width) {
                            setResizing(true);
                        }
                    }
                }
            })
            // it exists by this point, so observe
            resizeObserver.observe(windowContentRef.current!);
        }
    }, [initialDimensions]);

    return (
        <Rnd
            default={{
                x: 0,
                y: 0,
                width: 720,
                height: 480,
            }}
            disableDragging={isFullscreen}
            enableResizing={!isFullscreen}
            position={isFullscreen ? { x: 0, y: 0 } : undefined}
            minWidth={props.minWidth}
            minHeight={props.minHeight}
            bounds="window"
            dragHandleClassName='window_handler'
            style={{
                pointerEvents: minimized ? 'none' : 'auto'
            }}
            size={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}
        >
            <div className={`${minimized ? 'pointer_events_none' : ''} window_container`}>
                <div style={{ minWidth: props.minWidth }} className="window_handler">
                    <div className="top_right_window">
                        <p>
                            {
                                props.description ?? "Window"
                            }
                        </p>
                        <div className="top_right_window_buttons">
                            <div onClick={handleMinimize} className="minimize_window_button"><RemoveIcon /></div>
                            <div onClick={handleFullscreen} className="fullscreen_window_button"><VideoLabelTwoToneIcon /></div>
                            <div onClick={handleExitWindow} className="exit_window_button"><CloseTwoToneIcon /></div>
                        </div>
                    </div>
                </div>
                <div ref={windowContentRef} className={` ${minimized ? 'pointer_events_none' : ''} window_content ${minimized ? 'minimized_window' : ""}`}>
                        {props.children}
                </div>
            </div>
        </Rnd>
    )
}

