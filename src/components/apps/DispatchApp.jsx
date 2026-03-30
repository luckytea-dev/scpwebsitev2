import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Radio, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function DispatchApp() {
  const [logs, setLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [onDuty, setOnDuty] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadLogs();
    const unsub = base44.entities.DispatchLog.subscribe(() => loadLogs());
    return () => unsub();
  }, []);

  const loadLogs = async () => {
    const l = await base44.entities.DispatchLog.list('-created_date', 50);
    setLogs(l);
  };

  const toggleDuty = async () => {
    const newState = !onDuty;
    setOnDuty(newState);
    await base44.entities.DispatchLog.create({
      action: newState ? 'DUTY_ON' : 'DUTY_OFF',
      message: `Agent ${currentUser?.full_name || 'Unknown'} is now ${newState ? 'ON' : 'OFF'} duty.`
    });
  };

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold flex items-center gap-2"><Radio /> Dispatch Center</h2>
        <button 
          onClick={toggleDuty}
          className={`px-8 py-3 rounded font-bold tracking-widest transition-all ${onDuty ? 'bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-900/40 shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'bg-green-900/20 text-green-500 border border-green-500/50 hover:bg-green-900/40 shadow-[0_0_15px_rgba(0,255,0,0.1)]'}`}
        >
          {onDuty ? 'END SHIFT' : 'START SHIFT'}
        </button>
      </div>
      
      <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded border border-slate-800 font-mono text-sm relative">
        <div className="absolute top-2 right-4 flex gap-2">
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-[10px] text-red-500 font-bold tracking-widest">LIVE</span>
        </div>
        <div className="space-y-3 mt-4">
          {logs.map(log => (
            <div key={log.id} className="pb-3 border-b border-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-500">[{format(new Date(log.created_date), 'HH:mm:ss')}]</span>
                <span className={`font-bold ${log.action === 'DUTY_ON' ? 'text-green-500' : log.action === 'DUTY_OFF' ? 'text-red-500' : 'text-blue-500'}`}>[{log.action}]</span>
              </div>
              <div className="text-slate-300 pl-[85px]">{log.message}</div>
            </div>
          ))}
          {logs.length === 0 && <div className="text-slate-600 italic mt-8 text-center border border-dashed border-slate-800 p-8 rounded">No signal...</div>}
        </div>
      </div>
    </div>
  );
}