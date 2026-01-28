import { useBrowsemStore } from '@/hooks/browsemStore';
import { useState } from 'react'

export default function HelloWorld(props: { msg: string, handleConnectToServer: () => void, }) {
  const [count, setCount] = useState(0)
  const browsemStore = useBrowsemStore();
  return (
    <>
      <div className="card">
        <button type="button" onClick={props.handleConnectToServer}>
            Continue as guest
        </button>
      </div>

      <p>
        Group call with anyone on the same URL you're on!
      </p>

      <p className="read-the-docs">
        bottom text
      </p>
    </>
  )
}
