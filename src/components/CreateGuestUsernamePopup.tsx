import { useBrowsemStore } from '@/hooks/browsemStore';
import { ChangeEvent, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function CreateGuestUsernamePopup(props: { username: string, setUsername: (newUsername: string) => void, handleConnectToServer: () => void, }) {
  const browsemStore = useBrowsemStore();
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      console.log(event.currentTarget.value);
      props.setUsername(event.currentTarget.value);
  }

  return (
    <>
        <div className="card">
            <label htmlFor="username">Username: </label>
            <input onChange={handleInputChange} type="text" name="username" id="username" value={props.username} />
            <button onClick={props.handleConnectToServer}>Continue As Guest</button>
        </div>

    </>
  )
}
