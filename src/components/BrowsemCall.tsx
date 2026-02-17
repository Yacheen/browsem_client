import { useEffect, useState } from 'react'
import './BrowsemCall.scss'
import CallSidebar from './CallSidebar'
import ChattersBoard from './ChattersBoard'
import { useCurrentCallStore } from '@/hooks/currentCallStore'

function BrowsemCall() {
    // handle starting/ending call here whenever mounts/unmounts.
    const currentCallStore = useCurrentCallStore();

    useEffect(() => {
        const connectToCall = async () => {
            await currentCallStore.startPeerConnection();
        }
    }, []);
  return (
      <div className="browsem-call">
        <CallSidebar />
        <ChattersBoard />
      </div>
  )
}

export default BrowsemCall
