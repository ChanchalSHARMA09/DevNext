import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    const connectSocket = (token) => {
        if (socket) {
            socket.disconnect();
        }

        const newSocket = io('http://localhost:5000', {
            withCredentials: true,
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket Handshake Rejection:", err.message);
        });

        setSocket(newSocket);
        return newSocket;
    };

    useEffect(() => {
        const checkLoggedInUser = async () => {
            const token = localStorage.getItem('accessToken');

            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data.user);
                    
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

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const register = async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user: loggedInUser } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        setUser(loggedInUser);
        connectSocket(accessToken);
        return loggedInUser;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout error on server:", error);
        } finally {
            localStorage.removeItem('accessToken');
            
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
            socket,
            login, 
            register, 
            logout, 
            isAuthenticated: !!user 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};