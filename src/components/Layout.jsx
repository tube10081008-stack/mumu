import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        // Get profile info
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(profile);
            }
        };
        getProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const roleName = userProfile?.role === 'admin' ? '관리자' : '배송기사';

    return (
        <div className="min-h-screen bg-toss-grey pb-20 md:pb-0">
            {/* Header */}
            <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-gray-100">
                <h1 className="text-xl font-bold text-slate-800">
                    무무베딩 <span className="text-toss-blue text-sm font-normal ml-1">{roleName}</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 hidden md:inline-block">
                        {userProfile?.name}님 안녕하세요
                    </span>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto p-4 md:p-6">
                {children}
            </main>

            {/* Admin Warning for mobile (Admin heavily desktop optimized usually) */}
            {userProfile?.role === 'admin' && (
                <div className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-800 text-white text-xs p-3 rounded-lg opacity-80 pointer-events-none text-center">
                    💡 관리자 기능은 PC 화면에 최적화되어 있습니다.
                </div>
            )}
        </div>
    );
}
