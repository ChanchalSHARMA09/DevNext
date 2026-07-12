export const activeLeaderboards = {};

export const handleContestSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected to Socket Arena: ${socket.id}`);

        socket.on('joinRoom', ({ roomId, userId, username, avatar }) => {
            if (!roomId || !userId) return;
            
            socket.join(roomId);
            socket.userId = userId; 
            socket.username = username || "Anonymous Gladiator";
            socket.roomId = roomId;
            socket.avatar = avatar;

            if (!activeLeaderboards[roomId]) {
                activeLeaderboards[roomId] = [];
            }

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

        socket.on('startContest', ({ roomId }) => {
            console.log(`Host (${socket.username}) fired startContest signal for room: ${roomId}`);
            io.to(roomId).emit('contestStarted');
        });

        socket.on('updateScore', ({ roomId, pointsAdded }) => {
            if (!activeLeaderboards[roomId]) return;

            const player = activeLeaderboards[roomId].find(p => p.socketId === socket.id);
            if (player) {
                player.score += pointsAdded;
            }

            activeLeaderboards[roomId].sort((a, b) => b.score - a.score);
            io.to(roomId).emit('leaderboardUpdate', activeLeaderboards[roomId]);
        });

        socket.on('leaveRoom', ({ roomId, userId }) => {
            const targetRoom = roomId || socket.roomId;
            const targetUser = userId || socket.userId;

            if (targetRoom && activeLeaderboards[targetRoom]) {
                activeLeaderboards[targetRoom] = activeLeaderboards[targetRoom].filter(p => p.userId !== targetUser);
                
                io.to(targetRoom).emit('userLeft', { userId: targetUser });
                io.to(targetRoom).emit('leaderboardUpdate', activeLeaderboards[targetRoom]);
            }
            socket.leave(targetRoom);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username || socket.id}`);
            
            if (socket.roomId && activeLeaderboards[socket.roomId]) {
                const player = activeLeaderboards[socket.roomId].find(p => p.socketId === socket.id);
                if (player) {
                    player.status = "DC";
                }
                
                io.to(socket.roomId).emit('leaderboardUpdate', activeLeaderboards[socket.roomId]);
            }
        });
    });
};