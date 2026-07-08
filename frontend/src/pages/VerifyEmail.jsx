import { useEffect, useState, useRef } from 'react'; // 🔥 Added useRef
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('Verifying your email...');
    const initialized = useRef(false); // 🔥 Tracks whether the API call has fired

    useEffect(() => {
        // Only proceed if this effect hasn't executed yet
        if (!initialized.current) {
            initialized.current = true; // Lock it down immediately so the second mount is ignored

            const verify = async () => {
                try {
                    const response = await api.get(`/auth/verify-email/${token}`);
                    setStatus('success');
                    setMessage(response.data.message);
                } catch (err) {
                    setStatus('error');
                    setMessage(err.response?.data?.message || 'Invalid or expired token.');
                }
            };
            verify();
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-6 shadow-2xl">
                {status === 'loading' && <Loader2 className="h-12 w-12 text-indigo-500 mx-auto animate-spin" />}
                {status === 'success' && <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />}
                {status === 'error' && <XCircle className="h-12 w-12 text-red-500 mx-auto" />}
                
                <h2 className="text-xl font-bold">{message}</h2>
                
                {status !== 'loading' && (
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition"
                    >
                        Go to Login
                    </button>
                )}
            </div>
        </div>
    );
}