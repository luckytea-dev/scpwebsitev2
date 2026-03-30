import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Shield, Eye, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const CHANNELS = [
  { id: 'general', name: 'Général', clearance: 1 },
  { id: 'commandement', name: 'Commandement', clearance: 4 }
];

export default function SpinMessengerApp() {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [input, setInput] = useState('');
  const [clearance, setClearance] = useState(1);
  const [users, setUsers] = useState([]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeDM, setActiveDM] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
    const unsubMsg = base44.entities.ChatMessage.subscribe(() => {
      loadData();
    });
    const unsubUsers = base44.entities.AgentAccount.subscribe(() => {
      loadData();
    });
    return () => { unsubMsg(); unsubUsers(); };
  }, [activeChannel, activeDM, currentUser?.id]);

  const loadData = async () => {
    let msgs = [];
    if (activeDM && currentUser) {
      const dmId1 = `dm_${currentUser.scp_id}_${activeDM}`;
      const dmId2 = `dm_${activeDM}_${currentUser.scp_id}`;
      const res1 = await base44.entities.ChatMessage.filter({ app: 'SPIN', channel_id: dmId1 }, '-created_date', 50);
      const res2 = await base44.entities.ChatMessage.filter({ app: 'SPIN', channel_id: dmId2 }, '-created_date', 50);
      msgs = [...res1, ...res2].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 50);
    } else {
      msgs = await base44.entities.ChatMessage.filter({ app: 'SPIN', channel_id: activeChannel }, '-created_date', 50);
    }
    setMessages(msgs.reverse());
    const u = await base44.entities.AgentAccount.list();
    setUsers(u);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    await base44.entities.ChatMessage.create({
      app: 'SPIN',
      channel_id: activeDM ? `dm_${currentUser.scp_id}_${activeDM}` : activeChannel,
      content: input,
      author_name: currentUser?.full_name || 'Agent',
      min_clearance: parseInt(clearance)
    });
    setInput('');
    setClearance(1);
  };

  const updatePresence = async (presence) => {
    if (currentUser) {
      await base44.auth.updateMe({ presence });
      setCurrentUser({ ...currentUser, presence });
    }
  };

  return (
    <div className="flex h-full text-slate-300">
      <div className="w-1/3 max-w-[250px] min-w-[130px] border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="font-bold text-white mb-2 flex items-center gap-2"><MessageSquare size={16} /> S.P.I.N.</div>
          <select 
            value={currentUser?.presence || 'ONLINE'} 
            onChange={(e) => updatePresence(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs outline-none"
          >
            <option value="ONLINE">🟢 Online</option>
            <option value="OFFLINE">⚫ Offline</option>
            <option value="ON_MISSION">🔴 On Mission</option>
          </select>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase border-b border-slate-800 mb-2 mt-2">Canaux</div>
          {CHANNELS.map(c => {
             if (currentUser && currentUser.clearance_level < c.clearance) return null;
             return (
               <button 
                 key={c.id} 
                 onClick={() => { setActiveChannel(c.id); setActiveDM(null); }}
                 className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!activeDM && activeChannel === c.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
               >
                 <span className="text-slate-600 mr-1">#</span> {c.name}
               </button>
             );
          })}
          
          <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase border-b border-slate-800 mb-2 mt-4">Comms. Directes</div>
          {users.map(u => (
            <button 
              key={u.id} 
              onClick={() => { setActiveDM(u.scp_id); setActiveChannel(null); }}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded transition-colors ${activeDM === u.scp_id ? 'bg-slate-800 text-white' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full ${u.presence === 'ONLINE' ? 'bg-green-500' : u.presence === 'ON_MISSION' ? 'bg-red-500' : 'bg-slate-600'}`} />
              <div className="flex-1 truncate text-sm">{u.full_name}</div>
              <div className="text-[10px] text-slate-500 hidden sm:block">L{u.clearance_level || 1}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-slate-950 relative">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map(msg => {
            const isAuthorized = (currentUser?.clearance_level || 1) >= msg.min_clearance;
            return (
              <div key={msg.id} className={`flex flex-col ${msg.author_id === currentUser?.scp_id ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="font-bold text-slate-400">{msg.author_name}</span>
                  <span className="text-slate-600 font-mono">{format(new Date(msg.created_date), 'HH:mm')}</span>
                  {msg.min_clearance > 1 && <span className="bg-red-900/50 text-red-400 px-1 rounded flex items-center gap-1"><Shield size={10}/> L{msg.min_clearance}</span>}
                </div>
                <div className={`max-w-[80%] p-3 rounded-lg border ${
                  isAuthorized 
                    ? msg.min_clearance > 1 ? 'bg-red-950/30 border-red-900/50 text-red-100' : 'bg-slate-800 border-slate-700' 
                    : 'bg-slate-900 border-slate-800 text-slate-600 blur-[2px] select-none'
                }`}>
                  {isAuthorized ? msg.content : 'CLASSIFIED - INSUFFICIENT CLEARANCE'}
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <select value={clearance} onChange={e => setClearance(e.target.value)} className="bg-slate-950 border border-slate-700 rounded p-2 text-xs outline-none text-slate-400">
            <option value={1}>L1</option>
            <option value={2}>L2</option>
            <option value={3}>L3</option>
            <option value={4}>L4</option>
            <option value={5}>L5</option>
          </select>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Transmit message..." 
            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-slate-500"
          />
          <button type="submit" className="bg-slate-200 text-slate-900 px-4 py-2 rounded font-bold hover:bg-white transition-colors">SEND</button>
        </form>
      </div>
    </div>
  );
}