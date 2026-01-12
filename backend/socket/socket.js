import { Server } from 'socket.io';

let io;
const userSockets = new Map(); // Map userId to socketId

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // User joins with their userId
        socket.on('join', (userId) => {
            console.log(`User ${userId} joined with socket ${socket.id}`);
            userSockets.set(userId, socket.id);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const getUserSocketId = (userId) => {
    return userSockets.get(userId);
};
