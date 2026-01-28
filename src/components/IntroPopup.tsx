import { useBrowsemStore } from '@/hooks/browsemStore';
import { useState } from 'react'

export default function IntroPopup(props: { msg: string, handleCreateGuestUsername: () => void, }) {
  const browsemStore = useBrowsemStore();

  return (
    <>
      <div className="card">
        <button type="button">
            Login
        </button>
        <button type="button">
            Create an account
        </button>
        <button type="button" onClick={props.handleCreateGuestUsername}>
            Continue as guest
        </button>
      </div>

      <p>
        Call with anyone on the same URL you're on!
      </p>

      <p className="read-the-docs">
        bottom text
      </p>
    </>
  )
}
