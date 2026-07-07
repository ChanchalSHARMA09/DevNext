// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null); // Expose socket via context so Lobby/Arena can use it!

    // Helper: Safely instantiate and connect a persistent Socket connection
    const connectSocket = (token) => {
        // If a socket already exists, disconnect it before spinning up a new one
        if (socket) {
            socket.disconnect();
        }

        const newSocket = io('http://localhost:5000', {
            withCredentials: true,
            auth: {
                token: token // Strictly satisfies your protectSocket backend guard
            },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket Handshake Rejection:", err.message);
        });

        setSocket(newSocket);
        return newSocket;
    };

    // 1. Check if user is already logged in on initial page load
    useEffect(() => {
        const checkLoggedInUser = async () => {
            const token = localStorage.getItem('accessToken');

            // Removed '&& user' so page refreshes actually restore your session!
            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data.user);
                    
                    // Successfully restored user session -> spin up their WebSocket
                    connectSocket(token);
                } catch (error) {
                    console.error("Session expired or invalid:", error);
                    localStorage.removeItem('accessToken');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkLoggedInUser();

        // Cleanup: Disconnect socket when the app completely unmounts
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    // 2. Register Function
    const register = async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        const { accessToken, user: newUser } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        setUser(newUser);
        connectSocket(accessToken); // Spin up authenticated socket
        return newUser;
    };

    // 3. Login Function
    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user: loggedInUser } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        setUser(loggedInUser);
        connectSocket(accessToken); // Spin up authenticated socket
        return loggedInUser;
    };

    // 4. Logout Function
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout error on server:", error);
        } finally {
            localStorage.removeItem('accessToken');
            
            // Sever WebSocket connection immediately and clear state
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            socket, // Now your Lobby.jsx can grab 'socket' directly from useAuth()!
            login, 
            register, 
            logout, 
            isAuthenticated: !!user 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom Hook for clean imports: const { user, login } = useAuth();
export const useAuth = () => {
    return useContext(AuthContext);
};