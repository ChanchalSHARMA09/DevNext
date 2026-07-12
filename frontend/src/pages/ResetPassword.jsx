import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await api.put(`/auth/reset-password/${token}`, { password });
            localStorage.setItem('accessToken', response.data.accessToken);
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-center">Create New Password</h2>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password (min 6 chars)" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                    />
                    <input 
                        type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                    />
                    <button 
                        type="submit" disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                    >
                        {isLoading ? 'Resetting...' : 'Reset & Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}