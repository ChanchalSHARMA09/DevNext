// src/sockets/contest.socket.js

export const activeLeaderboards = {};

export const handleContestSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected to Socket Arena: ${socket.id}`);

        // 1. EVENT: User joins a specific contest room
        socket.on('joinRoom', ({ roomId, userId, username, avatar }) => {
            if (!roomId || !userId) return; // Ignore missing/unauthenticated loads
            
            socket.join(roomId);
            socket.userId = userId; 
            socket.username = username || "Anonymous Gladiator";
            socket.roomId = roomId;
            socket.avatar = avatar;

            if (!activeLeaderboards[roomId]) {
                activeLeaderboards[roomId] = [];
            }

            // 🔥 CRITICAL RECOVERY FIX: Search by userId (immutable), not temporary socketId
            const existingPlayer = activeLeaderboards[roomId].find(p => p.userId === userId);
            
            if (!existingPlayer) {
                activeLeaderboards[roomId].push({
                    socketId: socket.id,
                    userId: socket.userId,
                    username: socket.username,
                    avatar: socket.avatar,
                    score: 0,
                    status: "Competing"
                });
            } else {
                // Seamlessly reconnect: re-attach their new socket ID and restore active status
                existingPlayer.socketId = socket.id;
                existingPlayer.status = "Competing";
            }

            console.log(`${socket.username} joined arena room: ${roomId}`);

            io.to(roomId).emit('userJoined', {
                _id: socket.userId,
                username: socket.username,
                avatar: socket.avatar
            });

            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        });

        // 2. EVENT: Host clicks "Start Contest"
        socket.on('startContest', ({ roomId }) => {
            console.log(`Host (${socket.username}) fired startContest signal for room: ${roomId}`);
            io.to(roomId).emit('contestStarted');
        });

        // 3. EVENT: User submits an answer and scores points
        socket.on('updateScore', ({ roomId, pointsAdded }) => {
            if (!activeLeaderboards[roomId]) return;

            const player = activeLeaderboards[roomId].find(p => p.socketId === socket.id);
            if (player) {
                player.score += pointsAdded;
            }

            activeLeaderboards[roomId].sort((a, b) => b.score - a.score);
            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        });

        // 4. EVENT: User manual leave or room exit (Explicit quit button)
        socket.on('leaveRoom', ({ roomId, userId }) => {
            const targetRoom = roomId || socket.roomId;
            const targetUser = userId || socket.userId;

            if (targetRoom && activeLeaderboards[targetRoom]) {
                // Remove entirely ONLY when clicking the explicit exit route
                activeLeaderboards[targetRoom] = activeLeaderboards[targetRoom].filter(p => p.userId !== targetUser);
                
                io.to(targetRoom).emit('userLeft', { userId: targetUser });
                io.to(targetRoom).emit('leaderboardUpdate', activeLeaderboards[targetRoom]);
            }
            socket.leave(targetRoom);
        });

        // 5. EVENT: Connection drops or page triggers refresh
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username || socket.id}`);
            
            if (socket.roomId && activeLeaderboards[socket.roomId]) {
                const player = activeLeaderboards[socket.roomId].find(p => p.socketId === socket.id);
                if (player) {
                    // 🔥 REFRESH PROOF FIX: Flag status to Offline instead of stripping from RAM
                    player.status = "DC";
                }
                
                // Broadcast update so other contestants see them go line-through/offline
                io.to(socket.roomId).emit('leaderboardUpdate', activeLeaderboards[socket.roomId]);
            }
        });
    });
};