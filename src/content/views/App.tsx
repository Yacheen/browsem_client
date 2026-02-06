import { useState } from 'react'
import WindowHandler from '@/components/WindowHandler'
import BrowsemCall from '@/components/BrowsemCall'

function App() {
    return (
        // <div style = {{
        //     pointerEvents: 'auto'
        // }}>
        <WindowHandler minWidth={360} minHeight={240} type='BrowsemCall' description='Group call in https://twitch.tv/xqc' closeMyWindow={() => console.log('hi')}>
            <BrowsemCall />
        </WindowHandler>
        // </div>
    )
}

export default App
