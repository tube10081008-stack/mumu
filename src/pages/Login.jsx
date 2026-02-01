import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert('로그인 실패: ' + error.message);
        } else {
            // Role check will happen in a protected route or here later
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-toss-grey flex flex-col justify-center px-6">
            <div className="max-w-md w-full mx-auto">
                {/* Logo / Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">무무베딩 배송</h1>
                    <p className="text-toss-grey-deep">오늘도 안전한 배송 부탁드려요</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="delivery@mumu.com"
                            className="w-full bg-toss-grey border-0 rounded-2xl py-4 px-5 text-lg placeholder-slate-400 focus:ring-2 focus:ring-toss-blue transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 입력"
                            className="w-full bg-toss-grey border-0 rounded-2xl py-4 px-5 text-lg placeholder-slate-400 focus:ring-2 focus:ring-toss-blue transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-toss-blue hover:bg-blue-600 text-white font-bold rounded-2xl py-4 text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? '로그인 중...' : '시작하기'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400">
                        계정이 없으신가요?
                        <span onClick={() => navigate('/signup')} className="text-toss-blue cursor-pointer font-bold ml-1 hover:underline">
                            여기서 생성하세요
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
