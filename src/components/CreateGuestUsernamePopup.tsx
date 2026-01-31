import { useBrowsemStore } from '@/hooks/browsemStore';
import { ChangeEvent, useState } from 'react'
import "./CreateGuestUsernamePopup.css";
import GoBack from './GoBack';

export default function CreateGuestUsernamePopup(props: { username: string, setUsername: (newUsername: string) => void, handleConnectToServer: () => void, }) {
  const browsemStore = useBrowsemStore();
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      console.log(event.currentTarget.value);
      props.setUsername(event.currentTarget.value);
  }

  return (
    <>
        <div className="card">
            <div className="go-back-container-create-username">
                <GoBack where='Intro' goBack={browsemStore.setCurrentSelection} />
            </div>
            <div className="create-username-container">
                <label htmlFor="username" className="username-label">Username: </label>
                <input onChange={handleInputChange} type="text" name="username" id="username" value={props.username} />
            </div>
            <button onClick={props.handleConnectToServer}>Continue As Guest</button>
        </div>

    </>
  )
}
