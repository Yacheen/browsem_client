import { useCurrentCallStore } from '@/hooks/currentCallStore';
import './ChattersBoard.scss'
import BrowsemChatter from './BrowsemChatter';

function ChattersBoard() {
    const currentCallStore = useCurrentCallStore();
    return (
        <div className="chatters-board">
            {
                currentCallStore.chatterChannel?.chatters.map(chatter => (
                    <BrowsemChatter chatter={chatter} />
                ))
            }
        </div>
    )
}

export default ChattersBoard;
