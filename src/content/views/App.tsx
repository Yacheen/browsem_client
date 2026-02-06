
import { useState, useMemo } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from "@emotion/react";
import { StyledEngineProvider } from '@mui/material/styles';
import WindowHandler from '@/components/WindowHandler';
import BrowsemCall from '@/components/BrowsemCall';
import ReactDOMServer from 'react-dom/server';

export default function App() {
    return (
        <WindowHandler minWidth={360} minHeight={240} type='BrowsemCall' description='Group call in https://twitch.tv/xqc' closeMyWindow={() => console.log('hi')}>
            <BrowsemCall />
        </WindowHandler>
    )
}

