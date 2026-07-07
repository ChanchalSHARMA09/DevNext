// src/services/socket.js
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Initialize un-connected socket instance
export const socket = io(BACKEND_URL, {
    autoConnect: false, // We will explicitly connect once the user logs in!
    withCredentials: true
});