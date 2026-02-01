import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('driver');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role, // 'admin' or 'driver'
                },
            },
        });

        if (error) {
            alert('가입 실패: ' + error.message);
        } else {
            alert('계정이 생성되었습니다! 이제 로그인해주세요.');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-toss-grey flex flex-col justify-center px-6">
            <div className="max-w-md w-full mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">계정 생성 (임시)</h1>
                    <p className="text-slate-500">테스트용 계정을 만들어보세요.</p>
                </div>

                <form onSubmit={handleSignup} className="bg-white rounded-3xl p-8 shadow-sm space-y-4">
                    <Input
                        label="이름"
                        placeholder="예: 홍기사, 관리자"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    <Input
                        label="이메일"
                        type="email"
                        placeholder="user@mumu.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <Input
                        label="비밀번호 (6자리 이상)"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-600 ml-1">역할</label>
                        <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="role" value="driver" checked={role === 'driver'} onChange={() => setRole('driver')} />
                                <span>배송기사</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} />
                                <span>관리자</span>
                            </label>
                        </div>
                    </div>

                    <Button type="submit" className="mt-4">계정 만들기</Button>
                </form>
            </div>
        </div>
    );
}
