import { useState } from 'react'
import './App.css'
import WindowHandler from '@/components/WindowHandler'
import BrowsemCall from '@/components/BrowsemCall'

function App() {
  return (
    <WindowHandler type='BrowsemCall' description='Group call in https://twitch.tv/xqc' closeMyWindow={() => console.log('hi')}>
        <BrowsemCall />
    </WindowHandler>
  )
}

export default App
