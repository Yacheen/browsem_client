import { useBrowsemStore } from '@/hooks/browsemStore';
import { useState } from 'react'

export default function MainPopup() {
    const browsemStore = useBrowsemStore();

    return (
        <>
            <div className="card">
                <p className="read-the-docs">
                    connected as {browsemStore.username}
                </p>
            </div>
        </>
    )
}
