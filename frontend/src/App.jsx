// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Quiz from './pages/Quiz';
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';

// Guard: Blocks unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Guard: Redirects authenticated users away from login/register
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />

            <Route path="/analysis" element={
                <ProtectedRoute>
                    <Analysis />
                </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            {/* Added the Protected Quiz Route here */}
            <Route path="/quiz" element={
                <ProtectedRoute>
                    <Quiz />
                </ProtectedRoute>
            } />

            <Route path="/lobby/:roomId" element={
                <ProtectedRoute>
                    <Lobby />
                </ProtectedRoute>
            } />
            
            <Route path="/arena/:roomId" element={
                <ProtectedRoute>
                    <Arena />
                </ProtectedRoute>
            } />
        </Routes>
    );
}