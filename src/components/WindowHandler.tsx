import { useEffect, useRef, useState } from 'react'
import './WindowHandler.scss'
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import VideoLabelTwoToneIcon from '@mui/icons-material/VideoLabelTwoTone';
import RemoveIcon from '@mui/icons-material/Remove';
type WindowType = "BrowsemCall" | "Any";

export default function WindowHandler(props: {children: React.JSX.Element, closeMyWindow: () => void, description: string, type: WindowType }) {
    const [coords, setCoords] = useState<{ x: number, y: number }>({ x: 100, y: 100 });
    const [minimized, setMinimized] = useState<boolean>(false);
    const [initialDimensions, setInitialDimensions] = useState<{ width: number, height: number } | null>(null);
    const windowContentRef = useRef<HTMLDivElement>(null);
    const [resizing, setResizing] = useState<boolean>(false);

    const nodeRef = useRef<HTMLDivElement>(null);

    const handleMinimize = () => {
        setMinimized(!minimized);
    }
    const handleFullscreen = () => {

    }
    const handleExitWindow = () => {
        props.closeMyWindow();
    }
    // const handleDrag = (event: DraggableEvent, data: DraggableData) => {
    //     setCoords({ x: data.x, y: data.y });
    // };

    //     first, set initial dimensions, then add observer for when on-resize, set resizing to true and add overflow scroll width class.
    // (needed because minimize/unminimize changes with of tab due to resize overflow added invisible scrollbar, which changes width.)
    // useEffect(() => {
    //     if (windowContentRef.current !== null && initialDimensions === null) {
    //         setInitialDimensions({width: windowContentRef.current?.offsetWidth, height: windowContentRef.current?.offsetHeight});
    //     }
    // }, [windowContentRef])
    // useEffect(() => {
    //     if (initialDimensions !== null) {
    //         const resizeObserver = new ResizeObserver((entries) => {
    //             for (const entry of entries) {
    //                 if (entry.contentBoxSize) {
    //                     if (entry.borderBoxSize[0].blockSize !== initialDimensions?.height || entry.borderBoxSize[0].inlineSize !== initialDimensions.width) {
    //                         setResizing(true);
    //                     }
    //                 }
    //             }
    //         })
    //         // it exists by this point, so observe
    //         resizeObserver.observe(windowContentRef.current!);
    //     }
    // }, [initialDimensions]);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                overflow: 'hidden', // prevents dragging outside
                zIndex: 10000
                // width: '100vw',
                // height: '100vh',
                // position: 'fixed',
                // top: 0,
                // left: 0,
                // zIndex: 2147483647, // EXTENSION SAFE Z-INDEX
                // pointerEvents: 'none',
            }}
        >
            <Draggable nodeRef={nodeRef} defaultPosition={{ x: 100, y: 100 }} handle=".window_handler" bounds="parent">
                <div ref={nodeRef} className={`
                    ${minimized ? 'pointer_events_none' : ''} window_handler_container 
                `}>
                    <div className="window_handler">
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
                    <div ref={windowContentRef} className={`window_content ${minimized ? 'minimized_window' : ""} ${resizing ? 'resizing' : ''}`}>
                        {props.children}
                    </div>
                </div>
            </Draggable>
        </div>
    )
}

