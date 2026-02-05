import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, MapPin, Truck, Calendar, ArrowUp, ArrowDown, Edit2, X, Check, Search, History } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('STATUS'); // STATUS, ROUTES, LOCATIONS, SEARCH
    const [locations, setLocations] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Route Management State
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [routes, setRoutes] = useState([]); // For Status View (All drivers)
    const [driverRoutes, setDriverRoutes] = useState([]); // For Route Assignment View (Selected driver)

    // Location Form State
    const [editingLocId, setEditingLocId] = useState(null);
    const [locForm, setLocForm] = useState({ name: '', address: '', region: 'NORTH', access_info: '' });

    // Search Tab State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedHistoryLoc, setSelectedHistoryLoc] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);

    useEffect(() => {
        fetchBaseData();
    }, []);

    useEffect(() => {
        if (activeTab === 'STATUS') fetchAllRoutesStatus();
        if (activeTab === 'ROUTES' && selectedDriver) fetchDriverRoutes();
    }, [activeTab, selectedDate, selectedDriver]);

    const fetchBaseData = async () => {
        const { data: locs } = await supabase.from('locations').select('*').order('name');
        const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'driver');
        setLocations(locs || []);
        setDrivers(profs || []);
    };

    // --- TAB 1: STATUS LOGIC ---
    const fetchAllRoutesStatus = async () => {
        // Fetch routes + logs
        const { data } = await supabase
            .from('daily_routes')
            .select(`
        *,
        location:locations(*),
        driver:profiles(*),
        logs:delivery_logs(*)
      `)
            .eq('date', selectedDate)
            .order('sequence');

        setRoutes(data || []);
    };

    const getStatusColor = (logs) => {
        if (!logs || logs.length === 0) return 'bg-slate-100 text-slate-400 border-slate-200';
        const type = logs[0].type;
        if (type === 'DELIVERY') return 'bg-blue-100 text-toss-blue border-blue-200';
        if (type === 'PICKUP') return 'bg-orange-100 text-orange-600 border-orange-200';
        if (type === 'BOTH') return 'bg-indigo-100 text-indigo-600 border-indigo-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getStatusText = (logs) => {
        if (!logs || logs.length === 0) return '대기 중';
        const type = logs[0].type;
        const time = new Date(logs[0].created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const mapping = { DELIVERY: '배송 완료', PICKUP: '회수 완료', BOTH: '배송+회수', OTHER: '기타' };
        return `${mapping[type]} (${time})`;
    };

    // --- TAB 2: ROUTE MANAGEMENT LOGIC ---
    const fetchDriverRoutes = async () => {
        const { data } = await supabase
            .from('daily_routes')
            .select('*, location:locations(*)')
            .eq('date', selectedDate)
            .eq('driver_id', selectedDriver)
            .order('sequence');
        setDriverRoutes(data || []);
    };

    const handleAssignRoute = async (locationId) => {
        if (!selectedDriver) return alert('기사님을 선택해주세요.');

        // Get current max sequence
        const nextSeq = driverRoutes.length + 1;

        const { error } = await supabase.from('daily_routes').insert([{
            date: selectedDate,
            driver_id: selectedDriver,
            location_id: locationId,
            sequence: nextSeq,
            status: 'PENDING'
        }]);

        if (error) alert(error.message);
        else fetchDriverRoutes();
    };

    const handleRemoveRoute = async (routeId) => {
        if (!confirm('정말 이 경로를 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('daily_routes').delete().eq('id', routeId);
        if (error) alert(error.message);
        else fetchDriverRoutes();
    };

    const moveRoute = async (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === driverRoutes.length - 1) return;

        const newRoutes = [...driverRoutes];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newRoutes[index], newRoutes[targetIndex]] = [newRoutes[targetIndex], newRoutes[index]];

        // Optimistic UI update
        setDriverRoutes(newRoutes);

        // DB Update (Swap sequences)
        const itemA = newRoutes[index];
        const itemB = newRoutes[targetIndex];

        await supabase.from('daily_routes').update({ sequence: index + 1 }).eq('id', itemA.id);
        await supabase.from('daily_routes').update({ sequence: targetIndex + 1 }).eq('id', itemB.id);

        fetchDriverRoutes();
    };

    const handleUpdateMemo = async (routeId, currentMemo) => {
        const newMemo = prompt('기사님께 전달할 지시사항을 입력하세요 (예: 회수만 진행)', currentMemo || '');
        if (newMemo === null) return; // Cancelled

        const { error } = await supabase.from('daily_routes').update({ admin_memo: newMemo }).eq('id', routeId);
        if (error) alert(error.message);
        else fetchDriverRoutes();
    };

    // --- TAB 3: LOCATION CRUD LOGIC ---
    const handleSaveLocation = async (e) => {
        e.preventDefault();
        if (!locForm.name || !locForm.address || !locForm.access_info) {
            return alert('모든 정보를 입력해주세요. (출입정보 포함)');
        }

        if (editingLocId) {
            // Update
            const { error } = await supabase.from('locations').update(locForm).eq('id', editingLocId);
            if (error) alert(error.message);
            else {
                alert('수정되었습니다.');
                setEditingLocId(null);
                setLocForm({ name: '', address: '', region: 'NORTH', access_info: '' });
                fetchBaseData();
            }
        } else {
            // Create
            const { error } = await supabase.from('locations').insert([locForm]);
            if (error) alert(error.message);
            else {
                alert('등록되었습니다.');
                setLocForm({ name: '', address: '', region: 'NORTH', access_info: '' });
                fetchBaseData();
            }
        }
    };

    const handleEditLocation = (loc) => {
        setEditingLocId(loc.id);
        setLocForm({ name: loc.name, address: loc.address, region: loc.region, access_info: loc.access_info });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLocation = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('locations').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchBaseData();
    };

    // --- TAB 4: SEARCH & HISTORY LOGIC ---
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query) {
            setSearchResults([]);
            return;
        }
        const lowerQ = query.toLowerCase();
        const results = locations.filter(loc =>
            loc.name.toLowerCase().includes(lowerQ) ||
            loc.address.toLowerCase().includes(lowerQ)
        );
        setSearchResults(results);
    };

    const handleSelectHistory = async (loc) => {
        setSelectedHistoryLoc(loc);
        // Fetch History
        const { data } = await supabase
            .from('daily_routes')
            .select('*, driver:profiles(name), logs:delivery_logs(*)')
            .eq('location_id', loc.id)
            .order('date', { ascending: false });

        setHistoryLogs(data || []);
    };


    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm overflow-x-auto">
                {['STATUS', 'ROUTES', 'LOCATIONS', 'SEARCH'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-toss-blue text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        {tab === 'STATUS' ? '배송 현황' :
                            tab === 'ROUTES' ? '경로 배정' :
                                tab === 'LOCATIONS' ? '배송지 관리' : '통합 검색'}
                    </button>
                ))}
            </div>

            {/* --- STATUS VIEW --- */}
            {activeTab === 'STATUS' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 bg-white p-4 rounded-3xl shadow-sm w-fit">
                        <Calendar className="text-toss-blue" />
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                            className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {drivers.map(driver => {
                            const myRoutes = routes.filter(r => r.driver_id === driver.id);
                            return (
                                <div key={driver.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                                                🤠
                                            </div>
                                            {driver.name}
                                        </div>
                                        <span className="text-slate-400 text-sm">{myRoutes.length}건 배정</span>
                                    </div>

                                    <div className="space-y-3">
                                        {myRoutes.map((route, idx) => {
                                            const logs = route.logs || [];
                                            return (
                                                <div key={route.id} className={`p-4 rounded-2xl border-2 ${getStatusColor(logs)} transition-all`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold">#{idx + 1}</span>
                                                            <span className="font-bold">{route.location.name}</span>
                                                        </div>
                                                        <span className="text-xs font-bold">{getStatusText(logs)}</span>
                                                    </div>
                                                    <div className="text-xs opacity-80 mb-2 pl-8">{route.location.address}</div>

                                                    {route.admin_memo && (
                                                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded-lg text-xs flex gap-2 mb-2 font-bold">
                                                            <span>📢 지시:</span>
                                                            <span>{route.admin_memo}</span>
                                                        </div>
                                                    )}

                                                    {logs.length > 0 && logs[0].memo && (
                                                        <div className="bg-white/40 p-2 rounded-lg text-xs flex gap-2 mt-2">
                                                            <span>💬 기사:</span>
                                                            <span>{logs[0].memo}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {myRoutes.length === 0 && <div className="text-slate-400 text-center py-4 text-sm">배정된 경로 없음</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- ROUTE ASSIGN VIEW --- */}
            {activeTab === 'ROUTES' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm grid md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="text-sm font-semibold text-slate-500">날짜</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-toss-grey border-0 rounded-xl p-3 mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-500">기사님</label>
                            <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full bg-toss-grey border-0 rounded-xl p-3 mt-1">
                                <option value="">선택해주세요</option>
                                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedDriver && (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Source List */}
                            <div className="bg-white p-5 rounded-3xl shadow-sm h-[600px] flex flex-col">
                                <h3 className="font-bold mb-4 px-2">전체 배송지 ({locations.length})</h3>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {locations.map(loc => {
                                        const isAssigned = driverRoutes.some(r => r.location_id === loc.id);
                                        return (
                                            <div key={loc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
                                                <div>
                                                    <div className="font-bold text-sm">{loc.name}</div>
                                                    <div className="text-xs text-slate-400">{loc.address}</div>
                                                </div>
                                                <button
                                                    onClick={() => !isAssigned && handleAssignRoute(loc.id)}
                                                    disabled={isAssigned}
                                                    className={`p-2 rounded-full shadow-sm transition-all ${isAssigned ? 'bg-slate-200 text-slate-400' : 'bg-white text-toss-blue hover:scale-110'}`}
                                                >
                                                    {isAssigned ? <Check size={16} /> : <Plus size={16} />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Assigned List */}
                            <div className="bg-blue-50/50 border-2 border-blue-100 p-5 rounded-3xl h-[600px] flex flex-col">
                                <h3 className="font-bold mb-4 px-2 text-toss-blue">
                                    {drivers.find(d => d.id === selectedDriver)?.name} 기사님의 경로 ({driverRoutes.length})
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {driverRoutes.map((route, idx) => (
                                        <div key={route.id} className="flex flex-col gap-2 p-3 bg-white border border-blue-100 rounded-xl shadow-sm animate-in slide-in-from-right-5 fade-in duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm truncate">{route.location.name}</div>
                                                    <div className="text-xs text-slate-400 truncate">{route.location.address}</div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => moveRoute(idx, 'up')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-toss-blue"><ArrowUp size={12} /></button>
                                                        <button onClick={() => moveRoute(idx, 'down')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-toss-blue"><ArrowDown size={12} /></button>
                                                    </div>
                                                    <button onClick={() => handleRemoveRoute(route.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors ml-2">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Admin Memo Actions */}
                                            <div className="pl-9 flex items-center gap-2">
                                                {route.admin_memo ? (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold flex-1 truncate">
                                                        🔔 {route.admin_memo}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300 flex-1">지시사항 없음</span>
                                                )}
                                                <button
                                                    onClick={() => handleUpdateMemo(route.id, route.admin_memo)}
                                                    className="text-xs text-slate-400 hover:text-toss-blue underline"
                                                >
                                                    {route.admin_memo ? '수정' : '메모추가'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {driverRoutes.length === 0 && <div className="text-center text-slate-400 mt-20">오른쪽 목록에서 <br />(+) 버튼을 눌러 추가하세요</div>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- LOCATION CRUD VIEW --- */}
            {activeTab === 'LOCATIONS' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm sticky top-6">
                            <h2 className="text-lg font-bold mb-4">{editingLocId ? '배송지 수정' : '새 배송지 등록'}</h2>
                            <form onSubmit={handleSaveLocation} className="space-y-3">
                                <Input placeholder="장소명 (예: 네이버)" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} />
                                <Input placeholder="주소" value={locForm.address} onChange={e => setLocForm({ ...locForm, address: e.target.value })} />
                                <Input placeholder="출입정보 (#1234)" value={locForm.access_info} onChange={e => setLocForm({ ...locForm, access_info: e.target.value })} />

                                <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                                    {['NORTH', 'SOUTH'].map(r => (
                                        <button key={r} type="button"
                                            onClick={() => setLocForm({ ...locForm, region: r })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${locForm.region === 'NORTH' ? 'bg-white shadow text-toss-blue' : 'text-slate-400'}`}>
                                            {r === 'NORTH' ? '강북(북부)' : '강남(남부)'}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {editingLocId && (
                                        <Button type="button" variant="secondary" onClick={() => {
                                            setEditingLocId(null);
                                            setLocForm({ name: '', address: '', region: 'NORTH', access_info: '' });
                                        }}>취소</Button>
                                    )}
                                    <Button type="submit">{editingLocId ? '수정 완료' : '등록하기'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        {locations.map(loc => (
                            <div key={loc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between group hover:border-blue-200 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${loc.region === 'NORTH' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {loc.region === 'NORTH' ? '강북' : '강남'}
                                        </span>
                                        <span className="font-bold">{loc.name}</span>
                                    </div>
                                    <div className="text-sm text-slate-500">{loc.address}</div>
                                    <div className="text-sm text-toss-blue font-bold mt-1">🔑 {loc.access_info}</div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditLocation(loc)} className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-toss-blue rounded-xl">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB 4: SEARCH & HISTORY VIEW --- */}
            {activeTab === 'SEARCH' && (
                <div className="grid md:grid-cols-2 gap-6 h-[80vh]">
                    {/* Left: Search & List */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col h-full">
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                placeholder="배송지명 또는 주소 검색..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-toss-blue transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {searchResults.length === 0 && searchQuery && (
                                <div className="text-center text-slate-400 mt-10">검색 결과가 없습니다</div>
                            )}
                            {searchResults.map(loc => (
                                <div key={loc.id}
                                    onClick={() => handleSelectHistory(loc)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all ${selectedHistoryLoc?.id === loc.id ? 'bg-blue-50 border-2 border-toss-blue' : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'}`}>
                                    <div className="font-bold">{loc.name}</div>
                                    <div className="text-sm text-slate-500">{loc.address}</div>
                                </div>
                            ))}
                            {searchResults.length === 0 && !searchQuery && (
                                <div className="text-center text-slate-300 mt-20">
                                    <Search size={48} className="mx-auto mb-2 opacity-20" />
                                    배송지를 검색해보세요
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: History Timeline */}
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 h-full overflow-y-auto">
                        {!selectedHistoryLoc ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <History size={48} className="mb-4 opacity-50" />
                                <p>왼쪽에서 배송지를 선택하면</p>
                                <p>히스토리가 여기에 표시됩니다</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-10 border-b border-slate-100">
                                    <h2 className="text-xl font-bold">{selectedHistoryLoc.name}</h2>
                                    <p className="text-slate-500 text-sm">{selectedHistoryLoc.address}</p>
                                    <p className="text-toss-blue font-bold text-sm mt-1">🔑 {selectedHistoryLoc.access_info}</p>
                                </div>

                                <div className="relative pl-4 border-l-2 border-slate-200 space-y-8 pb-10">
                                    {historyLogs.map((log, idx) => {
                                        const logs = log.logs || [];
                                        const actions = logs[0];
                                        return (
                                            <div key={log.id} className="relative">
                                                <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                                <div className="text-xs font-bold text-slate-400 mb-1">{log.date}</div>

                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="font-bold flex items-center gap-2">
                                                            <span>🤠 {log.driver?.name}</span>
                                                            {actions ? (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${actions.type === 'DELIVERY' ? 'bg-blue-100 text-toss-blue' :
                                                                        actions.type === 'PICKUP' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                                                                    }`}>
                                                                    {actions.type === 'DELIVERY' ? '배송' : actions.type === 'PICKUP' ? '회수' : '배송+회수'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">미완료</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Admin Memo History */}
                                                    {log.admin_memo && (
                                                        <div className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded-lg mb-2">
                                                            <span className="font-bold mr-2">📢 지시:</span>
                                                            {log.admin_memo}
                                                        </div>
                                                    )}

                                                    {/* Driver Memo History */}
                                                    {actions && actions.memo && (
                                                        <div className="text-sm bg-slate-50 text-slate-600 p-2 rounded-lg">
                                                            <span className="font-bold mr-2">💬 기사:</span>
                                                            {actions.memo}
                                                        </div>
                                                    )}

                                                    {!log.admin_memo && (!actions || !actions.memo) && (
                                                        <div className="text-xs text-slate-300 italic">특이사항 없음</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {historyLogs.length === 0 && (
                                        <div className="text-sm text-slate-400 italic">방문 기록이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
