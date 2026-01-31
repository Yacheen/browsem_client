import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useBrowsemStore } from '@/hooks/browsemStore';
import { ChangeEvent, useState } from 'react'
import { useCreatingChannelStore } from '@/hooks/CreatingChannelStore';
import GoBack from './GoBack';
import "./CreateChannel.css";

export default function CreateChannel() {
  const browsemStore = useBrowsemStore();
  const createChannelStore = useCreatingChannelStore();

  const handleChannelNameChange = (event: ChangeEvent<HTMLInputElement>) => {
      createChannelStore.setChannelname(event.currentTarget.value);
  }
  const handleMaxChattersChange = (event: ChangeEvent<HTMLInputElement>) => {
      createChannelStore.setMaxChatters(event.currentTarget.valueAsNumber);
  }
  const handleCreateChannel = () => {
      createChannelStore.create(browsemStore.currentUrl);
      browsemStore.setErrors({ ...browsemStore.errors, channelNameTooLong: null, noChannelName: null });
  }

  return (
    <div className="create-channel-container">
        <div>
            <div className="go-back-container-new-channel">
                <GoBack where='Connected' goBack={browsemStore.setCurrentSelection} />
            </div>
            <h2>Create a channel</h2>
            <div className="create-channel-form">
                <div className="channelname-container">
                    <label htmlFor="channelname" className="channelname-label">Channel name: </label>
                    <input onChange={handleChannelNameChange} type="text" name="channelname" id="channelname" value={createChannelStore.channelName} />
                </div>
                <div className="max-chatters-container">
                    <label htmlFor="max-chatters" className="max-chatters-label">Max chatters: {createChannelStore.maxChatters}</label>
                    <input onChange={handleMaxChattersChange} type="range" id="max-chatters" name="max-chatters" min="2" max="30" value={createChannelStore.maxChatters} />
                </div>
            </div>
        </div>
        <div className="create-channel-buttons">
            <button onClick={handleCreateChannel} className="create-channel-btn">Create</button>
        </div>
    </div>
  )
}
