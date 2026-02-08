import { useState } from 'react'
import './BrowsemCall.scss'
import CallSidebar from './CallSidebar'
import ChattersBoard from './ChattersBoard'

function BrowsemCall() {
  return (
      <div className="browsem-call">
        <CallSidebar />
        <ChattersBoard />
      </div>
  )
}

export default BrowsemCall
