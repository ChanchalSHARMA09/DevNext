// src/pages/Lobby.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import api from '../services/api';
import { Users, Play, Copy, Check, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Lobby() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [contest, setContest] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Fetch initial room details and connect WebSocket
    useEffect(() => {
        // Safety guard: Don't execute if the socket or user context isn't ready yet
        if (!socket || !user) return;

        const fetchRoomData = async () => {
            try {
                // 1. Fetch initial room state via REST
                const response = await api.get(`/contest/room/${roomId}`); 
                
                const contestData = response.data.data || response.data.contest || response.data;
                setContest(contestData);
                
                const initialParticipants = contestData.participants || [user];
                setParticipants(initialParticipants);
                setLoading(false);

                // 2. Prepare the room join payload
                const joinPayload = { 
                    roomId, 
                    userId: user.id || user._id, 
                    username: user.username, 
                    avatar: user.avatar 
                };

                // Helper: Emits joinRoom safely only when the transport is open
                const performJoin = () => {
                    console.log("Socket connected cleanly! Emitting joinRoom:", joinPayload);
                    socket.emit('joinRoom', joinPayload);
                };

                // 3. Bulletproof Socket Handshake Strategy
                if (socket.connected) {
                    // If socket is already up and authenticated, join instantly
                    performJoin();
                } else {
                    // Attach freshest token just in case it refreshed during API call
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        socket.auth = { token };
                    }
                    
                    socket.connect();
                    
                    // CRITICAL: Queue emit to fire the exact millisecond handshake succeeds!
                    socket.once('connect', performJoin);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load lobby. Room may not exist.');
                setLoading(false);
            }
        };

        fetchRoomData();

        // 4. Real-time WebSocket Listeners (Kept exactly as you wrote them!)
        socket.on('leaderboardUpdate', (fullPlayerList) => {
            // Map the backend's 'userId' to '_id' so it perfectly matches your UI's expected variables
            const synchronizedList = fullPlayerList.map(player => ({
                _id: player.userId,
                username: player.username,
                avatar: player.avatar
            }));

            // Instantly overwrite the local state with the server's master list
            setParticipants(synchronizedList);
        });

        socket.on('userLeft', ({ userId }) => {
            const targetId = String(userId);
            setParticipants((prev) => prev.filter((p) => String(p.id || p._id) !== targetId));
        });

        socket.on('contestStarted', () => {
            navigate(`/arena/${roomId}`);
        });

        // 5. Cleanup: Leave room and strip listeners safely when unmounting
        return () => {
            // Remove the one-time connect listener if component unmounts mid-handshake
            socket.off('connect');
            
            socket.emit('leaveRoom', { roomId, userId: user?.id || user?._id });
            socket.off('userJoined');
            socket.off('userLeft');
            socket.off('contestStarted');
        };
    }, [roomId, user, socket, navigate]);

    // Copy Room ID to clipboard
    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Host triggers contest start
    const handleStartContest = async () => {
        try {
            // Pass { roomId } inside the body object so req.body.roomId exists on the backend!
            await api.post(`/contest/start`, { roomId });
            
            // Emit socket event to navigate all waiting participants to the Arena
            socket.emit('startContest', { roomId });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to start the match.');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
                Connecting to live lobby...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-white">Lobby Error</h2>
                <p className="mt-2 text-sm text-slate-400">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>
            </div>
        );
    }

    // Safely extract IDs as Strings
    const currentUserId = String(user?.id || user?._id);
    
    // Look specifically for hostId now!
    const roomHostId = String(contest?.hostId);
    
    const isHost = Boolean(currentUserId && roomHostId && currentUserId === roomHostId);

    // console.log("--- HOST DEBUGGER ---", {
    // "Logged-In User Object": user,
    // "Extracted Current User ID": user?._id || user?.id,
    // "Fetched Contest Object": contest,
    // "Extracted Room Host ID": contest?.hostId || contest?.host
    // });

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-100">
            <div className="mx-auto max-w-4xl">
                {/* Lobby Header */}
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                            Waiting Lobby
                        </span>
                        <h1 className="mt-2 text-3xl font-bold text-white">{contest?.title || 'Battle Arena'}</h1>
                    </div>

                    {/* Shareable Room ID Badge */}
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5">
                        <span className="text-xs font-semibold uppercase text-slate-500">Room Code:</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">{roomId}</span>
                        <button
                            onClick={copyRoomId}
                            className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            title="Copy Code"
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="mt-8 grid gap-8 md:grid-cols-3">
                    {/* Left 2 Cols: Participant List */}
                    <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2 font-semibold text-white">
                                <Users className="h-5 w-5 text-indigo-400" />
                                <span>Gladiators in Arena</span>
                            </div>
                            <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-medium text-slate-300">
                                {participants.length} Joined
                            </span>
                        </div>

                        <div className="mt-6 space-y-3">
                            {participants.map((player, idx) => (
                                <div
                                    key={player.id || player._id || idx}
                                    className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/50 p-3.5"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <img
                                            src={player.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Gladiator"}
                                            alt={player.username}
                                            className="h-10 w-10 rounded-full border border-slate-700 bg-slate-800"
                                        />
                                        <div>
                                            <span className="font-semibold text-white">{player.username}</span>
                                            {(player.id === contest?.hostId || player._id === contest?.hostId) && (
                                                <span className="ml-2 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 border border-amber-500/20">
                                                    Host
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="Ready"></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Col: Host Control Panel */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between h-fit">
                        <div>
                            <h3 className="font-bold text-white">Match Status</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Players can join until the host launches the contest.
                            </p>
                        </div>

                        <div className="mt-8">
                            {isHost ? (
                                <button
                                    onClick={handleStartContest}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
                                >
                                    <Play className="h-4 w-4 fill-current" /> Start Contest Now
                                </button>
                            ) : (
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                                    <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                                    <span className="text-xs font-medium text-slate-400">Waiting for host to start...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}