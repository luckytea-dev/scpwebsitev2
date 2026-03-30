import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Crosshair, Users, Lock, MessageSquare, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function MtfApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('chat');
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.is_mtf || currentUser.clearance_level >= 5 || currentUser.is_admin) {
      loadData();
    }
    
    const unsubC = base44.entities.MTFChannel.subscribe(() => loadData());
    const unsubM = base44.entities.ChatMessage.subscribe(() => {
      if (activeChannel) loadMessages(activeChannel.id);
    });
    const unsubU = base44.entities.AgentAccount.subscribe(() => loadMembers());
    
    return () => { unsubC(); unsubM(); unsubU(); };
  }, [activeChannel?.id, currentUser]);

  const loadData = async () => {
    const c = await base44.entities.MTFChannel.list();
    const allowed = c.filter(ch => currentUser?.clearance_level >= 5 || ch.category === currentUser?.mtf_unit_id);
    setChannels(allowed);
    if (!activeChannel && allowed.length > 0) setActiveChannel(allowed[0]);
    loadMembers();
  };

  const loadMembers = async () => {
    const u = await base44.entities.AgentAccount.filter({ is_mtf: true });
    setMembers(u);
  };

  const loadMessages = async (channelId) => {
    const msgs = await base44.entities.ChatMessage.filter({ app: 'MTF', channel_id: channelId }, '-created_date', 100);
    setMessages(msgs.reverse());
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChannel) return;
    await base44.entities.ChatMessage.create({
      app: 'MTF',
      channel_id: activeChannel.id,
      content: input,
      author_name: currentUser?.full_name || 'Agent',
      min_clearance: activeChannel.min_clearance
    });
    setInput('');
  };

  const createChannel = async () => {
    const name = prompt('Channel Name:');
    const category = prompt('Category (e.g. Incident Niveau Rouge, Black Ops) ou Nom MTF:');
    if (name && category) {
      await base44.entities.MTFChannel.create({ name, category, min_clearance: 4 });
    }
  };

  const hasAccess = currentUser?.is_mtf || currentUser?.clearance_level >= 5 || currentUser?.is_admin;
  const isLevel5 = currentUser?.clearance_level >= 5 || currentUser?.is_admin;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-red-500 p-8">
        <Shield size={64} className="mb-4" />
        <h2 className="text-3xl font-bold tracking-widest mb-2">RESTRICTED AREA</h2>
        <p className="font-mono text-center">Mobile Task Force personnel only.<br/>Authentication failed.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950 text-slate-300 font-mono">
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-2"><Crosshair size={18} className="text-red-500" /> MTF COMM</div>
        </div>
        <div className="flex border-b border-slate-800 bg-slate-900">
          <button onClick={() => setTab('chat')} className={`flex-1 p-2 text-xs font-bold text-center ${tab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>CHANNELS</button>
          <button onClick={() => setTab('roster')} className={`flex-1 p-2 text-xs font-bold text-center ${tab === 'roster' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>ROSTER</button>
        </div>

        {tab === 'chat' && (
          <div className="flex-1 overflow-auto p-2">
            {Object.entries(channels.reduce((acc, c) => {
              (acc[c.category] = acc[c.category] || []).push(c);
              return acc;
            }, {})).map(([category, chans]) => (
              <div key={category} className="mb-4">
                <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase tracking-widest">{category}</div>
                {chans.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveChannel(c); loadMessages(c.id); }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${activeChannel?.id === c.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
                  >
                    {c.min_clearance >= 4 ? <Lock size={12} className="text-red-400" /> : <MessageSquare size={12} />}
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            ))}
            {isLevel5 && (
              <button onClick={createChannel} className="w-full mt-4 p-2 border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 rounded text-xs flex items-center justify-center gap-2">
                <Plus size={12} /> NEW SECURE CATEGORY
              </button>
            )}
          </div>
        )}

        {tab === 'roster' && (
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {members.map(m => (
              <div key={m.id} className="p-2 border border-slate-800 bg-slate-900 rounded">
                <div className="font-bold text-white text-sm">{m.full_name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-500">{m.mtf_unit_id || 'Unassigned'}</span>
                  <span className="text-[10px] px-1 bg-red-900/30 text-red-400 rounded">L{m.clearance_level}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col relative">
        {tab === 'chat' && activeChannel ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-lg flex items-center gap-2">
                  {activeChannel.name}
                  {activeChannel.min_clearance >= 4 && <span className="bg-red-900 px-2 py-0.5 rounded text-[10px] text-white">CLASSIFIED</span>}
                </div>
                <div className="text-xs text-slate-500 uppercase">{activeChannel.category}</div>
              </div>
              {isLevel5 && (
                <button onClick={() => { base44.entities.MTFChannel.delete(activeChannel.id); setActiveChannel(null); }} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={activeChannel.name.startsWith('Rapport') ? "bg-slate-100 text-slate-900 p-6 rounded border-l-4 border-black font-serif shadow-inner mb-4" : "bg-slate-900 p-3 rounded border border-slate-800 mb-4"}>
                  <div className={`flex items-center gap-2 text-xs ${activeChannel.name.startsWith('Rapport') ? 'border-b border-slate-300 pb-2 mb-4' : 'mb-2'}`}>
                    <span className={`font-bold ${activeChannel.name.startsWith('Rapport') ? 'text-black text-sm uppercase' : 'text-blue-400'}`}>{msg.author_name}</span>
                    <span className={activeChannel.name.startsWith('Rapport') ? 'text-slate-500' : 'text-slate-600'}>{format(new Date(msg.created_date), 'HH:mm:ss')}</span>
                  </div>
                  <div className={`text-sm whitespace-pre-wrap ${activeChannel.name.startsWith('Rapport') ? 'text-black leading-relaxed text-base' : 'text-slate-300'}`}>{msg.content}</div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-slate-600 text-center py-8">SECURE CHANNEL ESTABLISHED.</div>}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/50">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Encrypt and transmit..." 
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white outline-none focus:border-slate-500 font-mono"
              />
            </form>
          </>
        ) : tab === 'roster' ? (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">MTF PERSONNEL MANAGEMENT</h2>
            {isLevel5 ? (
              <div className="text-slate-400">
                <p className="mb-4">Level 5 Command can assign personnel to MTF units. (Feature simplified for simulation: requires full DB access).</p>
                <div className="text-xs text-slate-500">To edit MTF status of users, use the primary Administration terminal.</div>
              </div>
            ) : (
              <div className="text-slate-500 text-center mt-20">Roster management restricted to Level 5 Command.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}