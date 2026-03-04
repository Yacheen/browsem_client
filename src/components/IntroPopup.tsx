import { useBrowsemStore } from '@/hooks/browsemStore';
import { useState } from 'react'
import "./IntroPopup.css";

export default function IntroPopup(props: { handleCreateGuestUsername: () => void, }) {
  const browsemStore = useBrowsemStore();

  return (
    <div className="intro-container">
        <div className="card">
            <button disabled type="button">
                Login
            </button>
            <button disabled type="button">
                Create an account
            </button>
            <button type="button" onClick={props.handleCreateGuestUsername}>
                Continue as guest
            </button>
        </div>

        <div className="intro-bottom-info">
            <p>
                Call with anyone on the same URL you're on!
            </p>

            {/*
                <p className="read-the-docs">
                    bottom text
                </p>
            */}
        </div>
    </div>
  )
}
