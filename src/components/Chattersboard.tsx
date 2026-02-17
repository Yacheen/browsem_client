import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './ChattersBoard.scss'
import BrowsemChatter, { QuickchatterWindow } from './BrowsemChatter';

function ChattersBoard() {
    const currentCallStore = useCurrentCallStore();
    const focusedWindow = useCurrentCallStore(state => state.focusedWindow);
    const setFocusedWindow = useCurrentCallStore(state => state.setFocusedWindow);

    const handleSetFocusedWindow = (windowToBeFocused: QuickchatterWindow | null) => {
        // multiple scenarios:
        // if none focused, focus it
        // if its someone else's window, set it regardless
        // if its the user's window of different type, focus, otherwise unfocus
        if (windowToBeFocused === null) {
            setFocusedWindow(null);
        }
        else {
            if (focusedWindow) {
                if (focusedWindow.username === windowToBeFocused.username) {
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
        <div className="chatters-board">
            {
                currentCallStore.chatterChannel?.chatters.map(chatter => (
                    <BrowsemChatter chatter={chatter} handleSetFocusedWindow={handleSetFocusedWindow} />
                ))
            }
        </div>
    )
}

export default ChattersBoard;
