import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './ChattersBoard.scss'
import BrowsemChatter, { QuickchatterWindow } from './BrowsemChatter';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { useSettingsStore } from '@/hooks/settingsStore';

function ChattersBoard() {
    const currentCallStore = useCurrentCallStore();
    const yourUsername = useBrowsemStore(state => state.username);
    const focusedWindow = useCurrentCallStore(state => state.focusedWindow);
    const setFocusedWindow = useCurrentCallStore(state => state.setFocusedWindow);
    const yourSettings = useSettingsStore(state => state.settings);

    const handleSetFocusedWindow = (windowToBeFocused: QuickchatterWindow | null) => {
        console.log('window to be focused: ', windowToBeFocused);
        // multiple scenarios:
        // if none focused, focus it
        // if its someone else's window, set it regardless
        // if its the user's window of different type, focus, otherwise unfocus
        if (windowToBeFocused === null) {
            setFocusedWindow(null);
        }
        else {
            if (focusedWindow) {
                if (focusedWindow.chatter.username === windowToBeFocused.chatter.username) {
                    // if the window ur swapping it with is of type undefined, it means its neither screenshare nor video window, so set focusedwindow to null
                    if (windowToBeFocused.stream === undefined && focusedWindow.stream !== undefined) {
                        setFocusedWindow(null);
                    }
                    else if (windowToBeFocused.stream?.type === focusedWindow!.stream?.type) {
                        setFocusedWindow(null);
                    }
                    else {
                        setFocusedWindow(windowToBeFocused);
                    }
                }
                else {
                    setFocusedWindow(windowToBeFocused);
                }
            }
            else {
                setFocusedWindow(windowToBeFocused);
            }
        }
    }
    return (
        focusedWindow !== null
        ?
            <div className="chattersboard_with_focused_window">
                <div className="focused_window">
                    {
                        focusedWindow.chatter.username === yourUsername
                        ?
                        <BrowsemChatter chatter={{...focusedWindow.chatter, settings: yourSettings}} handleSetFocusedWindow={handleSetFocusedWindow} focusedWindow={focusedWindow} isFocused={true} />
                            :
                        <BrowsemChatter chatter={focusedWindow.chatter} handleSetFocusedWindow={handleSetFocusedWindow} focusedWindow={focusedWindow} isFocused={true} />
                    }
                </div>
                <div className="chattersboard_bottom">
                    {
                        currentCallStore.chatterChannel?.chatters.map(chatter => (
                            <BrowsemChatter chatter={chatter} handleSetFocusedWindow={handleSetFocusedWindow} focusedWindow={focusedWindow} isFocused={false} />
                        ))
                    }
                </div>
            </div>
        :
            <div className="chatters-board">
                {
                    currentCallStore.chatterChannel?.chatters.map(chatter => (
                        chatter.username === yourUsername
                        ?
                            <BrowsemChatter chatter={{...chatter, settings: yourSettings}} handleSetFocusedWindow={handleSetFocusedWindow} focusedWindow={focusedWindow} isFocused={false} />
                            :
                        <BrowsemChatter chatter={chatter} handleSetFocusedWindow={handleSetFocusedWindow} focusedWindow={focusedWindow} isFocused={false} />
                    ))
                }
            </div>
    )
}

export default ChattersBoard;
