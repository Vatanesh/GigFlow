import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (userId) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            if (userId) {
                socket.emit('join', userId);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
