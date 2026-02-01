import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' | 'driver'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkRole(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) checkRole(session.user.id);
            else setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkRole = async (uid) => {
        // In a real app, role might be in JWT (user_metadata) to save DB call.
        // For now, let's trust the profile table.
        const { data } = await supabase.from('profiles').select('role').eq('id', uid).single();
        setUserRole(data?.role);
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-toss-blue font-bold">로딩 중...</div>;
    if (!session) return <Navigate to="/login" replace />;
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Redirect to their own dashboard if they try to access wrong one
        return <Navigate to={userRole === 'admin' ? '/admin' : '/driver'} replace />;
    }

    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Driver Routes */}
                <Route path="/driver" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <DriverDashboard />
                    </ProtectedRoute>
                } />

                {/* Smart Redirect */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        {/* Dashboard is a layout wrapper, the redirect happens inside ProtectedRoute logic effectively, 
                    but here we need a component that decides where to go if just /dashboard is hit.
                    Let's just use a simple redirector. */}
                        <RoleRedirector />
                    </ProtectedRoute>
                } />

                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

const RoleRedirector = () => {
    // This component renders inside ProtectedRoute, so session is valid.
    // We just need to fetch role again or pass it down. 
    // For simplicity, let's just show a loader or re-fetch (not optimal but works for MVP).
    const [role, setRole] = useState(null);
    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setRole(data?.role);
        });
    }, []);

    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'driver') return <Navigate to="/driver" replace />;
    return null;
}

export default App;
