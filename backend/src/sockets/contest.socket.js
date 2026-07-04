// src/sockets/contest.socket.js

// We keep an in-memory map of active rooms and their real-time leaderboards for blazing fast broadcasts
export const activeLeaderboards = {};

export const handleContestSockets = (io) => {
    // When a user's browser connects to the websocket server
    io.on('connection', (socket) => {
        console.log(`User connected to Socket Arena: ${socket.id}`);

        // 1. EVENT: User joins a specific contest room (e.g., Room "849-201")
        socket.on('joinRoom', ({ roomId, username }) => {
            socket.join(roomId);
            socket.username = username || "Anonymous Gladiator";
            socket.roomId = roomId;

            // Initialize leaderboard for this room if it doesn't exist yet
            if (!activeLeaderboards[roomId]) {
                activeLeaderboards[roomId] = [];
            }

            // Add player to the live leaderboard with 0 points if they aren't already listed
            const existingPlayer = activeLeaderboards[roomId].find(p => p.socketId === socket.id);
            if (!existingPlayer) {
                activeLeaderboards[roomId].push({
                    socketId: socket.id,
                    username: socket.username,
                    score: 0,
                    status: "Competing"
                });
            }

            console.log(`${socket.username} joined arena room: ${roomId}`);

            // Broadcast the updated leaderboard to EVERYONE in that room!
            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        });

        // 2. EVENT: User submits an answer and scores points
        socket.on('updateScore', ({ roomId, pointsAdded }) => {
            if (!activeLeaderboards[roomId]) return;

            // Find the player and update their real-time score
            const player = activeLeaderboards[roomId].find(p => p.socketId === socket.id);
            if (player) {
                player.score += pointsAdded;
            }

            // Sort leaderboard highest to lowest
            activeLeaderboards[roomId].sort((a, b) => b.score - a.score);

            // Broadcast the live position change immediately to every connected competitor
            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        });

        // 3. EVENT: User closes their browser or gets disconnected
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username || socket.id}`);
            if (socket.roomId && activeLeaderboards[socket.roomId]) {
                // Mark them as disconnected or remove them
                activeLeaderboards[socket.roomId] = activeLeaderboards[socket.roomId].filter(p => p.socketId !== socket.id);
                io.to(socket.roomId).emit('leaderboardUpdate', activeLeaderboards[socket.roomId]);
            }
        });
    });
};