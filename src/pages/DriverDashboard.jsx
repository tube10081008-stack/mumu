import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, KeyRound, MessageSquare, Truck, Edit3 } from 'lucide-react';

export default function DriverDashboard() {
    const [routes, setRoutes] = useState([]);
    const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
    const [selectedRoute, setSelectedRoute] = useState(null); // For Modal
    const [greeting, setGreeting] = useState('');

    // Action Form
    const [memo, setMemo] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        fetchMyRoutes();
        setRandomGreeting();
    }, []);

    const setRandomGreeting = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            setUserProfile(data);

            const hour = new Date().getHours();
            const msgs = [
                "오늘도 무사히! 안전운전 하세요 🚚",
                "기사님의 땀방울이 무무베딩의 자부심입니다 💪",
                "힘찬 하루 시작해보아요! 화이팅 🔥",
                "오늘도 도로 위 히어로가 되어주세요 🦸‍♂️",
                "기분 좋은 배송, 기분 좋은 하루 🍀"
            ];
            // Dynamic greeting based on time
            if (hour < 10) setGreeting("상쾌한 아침입니다! " + msgs[Math.floor(Math.random() * msgs.length)]);
            else if (hour > 18) setGreeting("오늘 하루도 정말 고생 많으셨어요 🌙");
            else setGreeting(msgs[Math.floor(Math.random() * msgs.length)]);
        }
    };

    const fetchMyRoutes = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Join with delivery_logs to get details
        const { data, error } = await supabase
            .from('daily_routes')
            .select('*, location:locations(*), logs:delivery_logs(*)')
            .eq('driver_id', user.id)
            .eq('date', today)
            .order('sequence', { ascending: true, nullsFirst: false });

        setRoutes(data || []);
    };

    const openActionModal = (route) => {
        setSelectedRoute(route);
        // Pre-fill memo if editing
        if (route.logs && route.logs.length > 0) {
            setMemo(route.logs[0].memo || '');
        } else {
            setMemo('');
        }
    };

    const handleAction = async (type) => {
        if (!selectedRoute) return;

        // Check if updating or inserting
        const existingLog = selectedRoute.logs && selectedRoute.logs.length > 0 ? selectedRoute.logs[0] : null;

        let error;
        if (existingLog) {
            // Update
            const { error: err } = await supabase.from('delivery_logs').update({ type, memo }).eq('id', existingLog.id);
            error = err;
        } else {
            // Insert
            const { error: err } = await supabase.from('delivery_logs').insert([{
                route_id: selectedRoute.id,
                type,
                memo
            }]);
            error = err;
        }

        if (error) {
            alert('기록 실패: ' + error.message);
        } else {
            // Update route status checks
            await supabase.from('daily_routes').update({ status: 'COMPLETED' }).eq('id', selectedRoute.id);

            await fetchMyRoutes(); // Refresh to see updated colors/logs
            setSelectedRoute(null);
            setMemo('');
        }
    };

    // NAVER MAP INTEGRATION
    const handleOpenMap = (address) => {
        const encodedAddr = encodeURIComponent(address);
        // Naver Map App Scheme
        const appUrl = `nmap://search?query=${encodedAddr}&appname=mumu-delivery`;

        // Redirect logic: Try app scheme
        window.location.href = appUrl;
    };

    const getStatusColor = (logs) => {
        if (!logs || logs.length === 0) return 'bg-white border-white hover:border-blue-100';
        const type = logs[0].type;
        if (type === 'DELIVERY') return 'bg-blue-50 border-blue-200';
        if (type === 'PICKUP') return 'bg-orange-50 border-orange-200';
        if (type === 'BOTH') return 'bg-indigo-50 border-indigo-200';
        return 'bg-gray-100 border-gray-200'; // Other
    };

    const getStatusLabel = (type) => {
        const mapping = { DELIVERY: '배송 완료', PICKUP: '회수 완료', BOTH: '배송+회수', OTHER: '기타 작업' };
        return mapping[type] || type;
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-r from-toss-blue to-blue-600 p-6 -mx-4 -mt-6 md:rounded-3xl md:mx-0 md:mt-0 text-white shadow-lg shadow-blue-200">
                <h1 className="text-2xl font-bold mb-1">{userProfile?.name} 님,</h1>
                <p className="text-blue-100 font-medium text-sm text-balance whitespace-pre-wrap">{greeting}</p>
                <div className="mt-4 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm">
                    <Truck size={16} />
                    <span className="text-sm font-bold">{routes.filter(r => r.status === 'COMPLETED').length} / {routes.length} 완료</span>
                </div>
            </div>

            <div className="space-y-3">
                {routes.map((route, idx) => {
                    const logs = route.logs || [];
                    const isCompleted = logs.length > 0;
                    const log = isCompleted ? logs[0] : null;

                    return (
                        <div
                            key={route.id}
                            onClick={() => openActionModal(route)}
                            className={`relative p-5 rounded-3xl shadow-sm border-2 transition-all active:scale-98 cursor-pointer ${getStatusColor(logs)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
                                    #{idx + 1}
                                </span>
                                {isCompleted ? (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.type === 'DELIVERY' ? 'bg-blue-100 text-toss-blue' :
                                            log.type === 'PICKUP' ? 'bg-orange-100 text-orange-600' :
                                                'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {getStatusLabel(log.type)}
                                    </span>
                                ) : (
                                    <span className={`text-xs font-bold ${route.location.region === 'NORTH' ? 'text-purple-500' : 'text-orange-500'}`}>
                                        {route.location.region === 'NORTH' ? '북부' : '남부'}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-1">{route.location.name}</h3>

                            {/* Admin Memo Alert */}
                            {route.admin_memo && (
                                <div className="mb-3 bg-yellow-100 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-xl text-sm font-bold flex items-start gap-2 animate-pulse">
                                    <span>📢</span>
                                    <span>{route.admin_memo}</span>
                                </div>
                            )}

                            <div
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop modal opening
                                    handleOpenMap(route.location.address);
                                }}
                                className="flex items-center gap-1 text-slate-500 text-sm mb-4 group cursor-pointer w-fit p-1 rounded-lg hover:bg-green-50 transition-colors"
                            >
                                <MapPin size={14} className="text-slate-400 group-hover:text-green-600" />
                                <span className="group-hover:text-green-600 group-hover:underline decoration-2 underline-offset-2">{route.location.address}</span>
                                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200 ml-1">
                                    NAVI 🚀
                                </span>
                            </div>

                            {isCompleted ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500 flex gap-2">
                                        <span>🕒 {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        {log.memo && <span>📝 {log.memo}</span>}
                                    </div>
                                    <div className="text-xs text-slate-400 text-right flex items-center justify-end gap-1">
                                        <Edit3 size={10} />
                                        눌러서 수정하기
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full text-toss-blue shadow-sm">
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">공동현관 비번</div>
                                        <div className="text-lg font-black text-slate-800 tracking-widest leading-none">{route.location.access_info || '없음'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Bottom Sheet */}
            {selectedRoute && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedRoute(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-10 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-lg font-bold text-slate-800">{selectedRoute.location.name}</span>
                                {selectedRoute.logs?.length > 0 && <span className="text-xs font-bold text-toss-blue bg-blue-50 px-2 py-0.5 rounded">수정중</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleAction('DELIVERY')} className="p-4 bg-blue-50 text-toss-blue font-bold rounded-2xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1 group">
                                <span className="text-2xl group-active:scale-125 transition-transform">📦</span>
                                배송 완료
                            </button>
                            <button onClick={() => handleAction('PICKUP')} className="p-4 bg-orange-50 text-orange-600 font-bold rounded-2xl hover:bg-orange-100 transition-colors flex flex-col items-center gap-1 group">
                                <span className="text-2xl group-active:scale-125 transition-transform">♻️</span>
                                회수 완료
                            </button>
                            <button onClick={() => handleAction('BOTH')} className="col-span-2 p-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span>🚀</span> 배송 + 회수 둘 다
                            </button>
                            <button onClick={() => handleAction('OTHER')} className="col-span-2 p-3 text-slate-400 text-sm font-medium hover:text-slate-600">
                                기타 / 특이사항만 기록
                            </button>
                        </div>

                        <div className="relative">
                            <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={memo}
                                onChange={e => setMemo(e.target.value)}
                                placeholder="특이사항 메모 (선택)"
                                className="w-full bg-slate-100 border-none rounded-xl py-4 pl-10 pr-4 text-sm focus:ring-2 focus:ring-toss-blue transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
