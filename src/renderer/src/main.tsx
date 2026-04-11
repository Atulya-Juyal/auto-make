import './assets/main.css'

import { createRoot } from 'react-dom/client'
import App from './App'

/* StrictMode double-mounts native layers (xterm, IPC subs) and is painful for PTY UIs. */
createRoot(document.getElementById('root')!).render(<App />)
