import { useEffect, useRef, useState } from 'react'
import './BrowsemCall.scss'
import CallSidebar from './CallSidebar'
import { useSnackbarStore } from '@/hooks/snackbarStore';
import { Alert, Snackbar } from '@mui/material';
import Slide from '@mui/material/Slide';
import ChattersBoard from './Chattersboard';

function BrowsemCall() {
    const message = useSnackbarStore(state => state.message);
    const open = useSnackbarStore(state => state.open);
    const type = useSnackbarStore(state => state.type);
    const setSnackbar = useSnackbarStore(state => state.setSnackbar);
  return (
      <div className="browsem-call">
        <CallSidebar />
        <ChattersBoard />
        {
            // open 
            // ?
            //     <Snackbar
            //         anchorOrigin={{vertical: "top", horizontal: "center"}}
            //         open={open}
            //         TransitionComponent={Slide}
            //         message={message}
            //         key={message}
            //         sx={{
            //             '& .MuiSvgIcon-root': {
            //                 fontSize: '20px', // Increases icon size
            //                 // color: type === "success" ? "hsl(120, 93%, 70%)" : type === "info" ? 'hsl(0, 0%, 90%)' : type === "error" ? "hsl(0, 99%, 67%)" : type === "warning" ? "hsl(22, 100%, 60%)" : "hsl(0, 0%, 90%)",
            //             },
            //             '& .MuiAlert-icon': {
            //                 fontSize: '20px', // Increases icon size
            //                 color: type === "success" ? "hsl(120, 93%, 70%)" : type === "info" ? 'hsl(0, 0%, 90%)' : type === "error" ? "hsl(0, 99%, 67%)" : type === "warning" ? "hsl(22, 100%, 60%)" : "hsl(0, 0%, 90%)",
            //             },
            //             '& .MuiAlert-message': {
            //                 fontSize: '14px', // Increases text size
            //             },
            //         }}
            //     >
            //         <Alert style={{background: "hsla(0, 0%, 30%, 1)", color: "white"}} onClose={() => setSnackbar(false, "", "success")} severity={type}>
            //             {message}
            //         </Alert>
            //     </Snackbar>
            // :
            //     null
        }
      </div>
  )
}

export default BrowsemCall
