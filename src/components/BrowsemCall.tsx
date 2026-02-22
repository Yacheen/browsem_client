import { useEffect, useRef, useState } from 'react'
import './BrowsemCall.scss'
import CallSidebar from './CallSidebar'
import ChattersBoard from './ChattersBoard'
import { useCurrentCallStore } from '@/hooks/currentCallStore'
import { useSettingsStore } from '@/hooks/settingsStore'

function BrowsemCall() {
    // handle starting/ending call here whenever mounts/unmounts.
    const currentCallStore = useCurrentCallStore();
    const setSettings = useSettingsStore(state => state.setSettings);
    const settings = useSettingsStore(state => state.settings);
    const chatterChannel = useCurrentCallStore(state => state.chatterChannel);
    const peerConnection = useCurrentCallStore(state => state.peerConnection);
    // state doesnt rehydrate fast enough. ends up running useEffects twice on app.
    // const connectAttemptedRef = useRef(false);
    //
    // useEffect(() => {
    //     const connectToCall = async () => {
    //         console.log('running connecttocall...');
    //         connectAttemptedRef.current = true;
    //         setSettings({
    //             ...settings,
    //             sharingScreen: false,
    //             cameraIsOn: false,
    //             microphoneIsOn: false,
    //         });
    //         await currentCallStore.startPeerConnection();
    //     }
    //     if (peerConnection === null && connectAttemptedRef.current === false) {
    //         connectToCall();
    //     }
    // }, [peerConnection]);
  return (
      <div className="browsem-call">
        <CallSidebar />
        <ChattersBoard />
      </div>
  )
}

export default BrowsemCall
