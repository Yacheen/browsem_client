import { useBrowsemStore } from '@/hooks/browsemStore';
import { ChangeEvent, useState } from 'react'
import "./CreateGuestUsernamePopup.css";
import GoBack from './GoBack';
import { useSnackbarStore } from '@/hooks/snackbarStore';

export default function CreateGuestUsernamePopup(props: { username: string, setUsername: (newUsername: string) => void, handleConnectToServer: (username: string) => void, }) {
    const browsemStore = useBrowsemStore();
    const setSnackbar = useSnackbarStore(state => state.setSnackbar);
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        props.setUsername(event.currentTarget.value);
    }
    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    }
    const handleSubmit = () => {
        props.handleConnectToServer(props.username);
    }
  return (
    <>
        <div className="card">
            <div className="go-back-container-create-username">
                <GoBack where='Intro' goBack={browsemStore.setCurrentSelection} />
            </div>
            <div className="create-username-container">
                <label htmlFor="username" className="username-label">Username: </label>
                <input onKeyDown={handleKeyPress} onChange={handleInputChange} type="text" name="username" id="username" value={props.username} />
            </div>
            <button onClick={handleSubmit}>Continue As Guest</button>
        </div>

    </>
  )
}
