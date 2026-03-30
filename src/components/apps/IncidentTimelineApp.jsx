import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Plus, X, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';

const severityColors = {
  Minor: 'border-green-700 text-green-400',
  Moderate: 'border-yellow-700 text-yellow-400',
  Major: 'border-orange-700 text-orange-400',
  Critical: 'border-red-700 text-red-400 animate-pulse'
};

const statusColors = {
  Open: 'bg-red-900/40 text-red-400',
  Investigating: 'bg-yellow-900/40 text-yellow-400',
  Resolved: 'bg-green-900/40 text-green-400',
  Classified: 'bg-purple-900/40 text-purple-400'
};

export default function IncidentTimelineApp() {
  const [incidents, setIncidents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('timeline');
  const [form, setForm] = useState({ title: '', description: '', severity: 'Minor', status: 'Open', linked_scp: '', reporter_name: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => {
      const u = a.find(x => x.id === id);
      setCurrentUser(u);
      setForm(f => ({ ...f, reporter_name: u?.full_name || '' }));
    });
    loadIncidents();
    const unsub = base44.entities.IncidentReport.subscribe(() => loadIncidents());
    return () => unsub();
  }, []);

  const loadIncidents = async () => {
    const data = await base44.entities.IncidentReport.list('-created_date', 100);
    setIncidents(data);
  };

  const handleCreate = async () => {
    await base44.entities.IncidentReport.create({ ...form, reporter_id: currentUser?.id });
    setShowForm(false);
    setForm({ title: '', description: '', severity: 'Minor', status: 'Open', linked_scp: '', reporter_name: currentUser?.full_name || '' });
  };

  const updateStatus = async (id, status) => {
    await base44.entities.IncidentReport.update(id, { status });
  };

  const canEdit = currentUser?.clearance_level >= 2 || currentUser?.is_admin;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-red-400" /> INCIDENT TIMELINE</h2>
          <div className="flex gap-1">
            <button onClick={() => setView('timeline')} className={`px-3 py-1 text-xs rounded ${view === 'timeline' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>TIMELINE</button>
            <button onClick={() => setView('table')} className={`px-3 py-1 text-xs rounded ${view === 'table' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>TABLEAU</button>
          </div>
        </div>
        {canEdit && <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 border border-red-700 px-3 py-1.5 rounded text-white text-sm font-bold"><Plus size={14} /> NOUVEAU</button>}
      </div>

      {showForm && (
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-2 gap-3 max-w-3xl">
            <input placeholder="Titre de l'incident" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm h-20 resize-none" />
            <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm">
              {['Minor','Moderate','Major','Critical'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="SCP lié (ex: SCP-173)" value={form.linked_scp} onChange={e => setForm({...form, linked_scp: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <div className="col-span-2 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-700 rounded hover:bg-slate-800 text-sm">Annuler</button>
              <button onClick={handleCreate} className="px-4 py-1.5 bg-slate-200 text-black rounded font-bold hover:bg-white text-sm">ENREGISTRER</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {view === 'timeline' ? (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700" />
            {incidents.map((inc, i) => (
              <div key={inc.id} className="relative flex gap-6 mb-6 pl-16">
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 mt-1 ${severityColors[inc.severity] || 'border-slate-500'} bg-slate-950`} />
                <div className={`flex-1 bg-slate-900 border-l-4 ${severityColors[inc.severity]?.split(' ')[0] || 'border-slate-700'} rounded p-4`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{inc.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{format(new Date(inc.created_date), 'dd/MM/yyyy HH:mm')} — {inc.reporter_name || 'Inconnu'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inc.linked_scp && <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded border border-red-900">{inc.linked_scp}</span>}
                      {canEdit ? (
                        <select value={inc.status} onChange={e => updateStatus(inc.id, e.target.value)} className={`text-xs px-2 py-0.5 rounded border-0 outline-none cursor-pointer font-bold ${statusColors[inc.status]}`}>
                          {['Open','Investigating','Resolved','Classified'].map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColors[inc.status]}`}>{inc.status}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">{inc.description}</p>
                  <div className="mt-2 text-xs text-slate-500">Sévérité: <span className={severityColors[inc.severity]?.split(' ')[1]}>{inc.severity}</span></div>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <div className="text-center text-slate-600 py-16 border border-dashed border-slate-800 rounded">AUCUN INCIDENT ENREGISTRÉ</div>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-slate-500 text-left bg-slate-900">
              <th className="p-3">Date</th><th className="p-3">Titre</th><th className="p-3">Sévérité</th><th className="p-3">Statut</th><th className="p-3">Rapporteur</th>
            </tr></thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-3 text-slate-500">{format(new Date(inc.created_date), 'dd/MM/yy HH:mm')}</td>
                  <td className="p-3 text-white font-bold">{inc.title}</td>
                  <td className="p-3"><span className={`text-xs font-bold ${severityColors[inc.severity]?.split(' ')[1]}`}>{inc.severity}</span></td>
                  <td className="p-3">
                    {canEdit ? (
                      <select value={inc.status} onChange={e => updateStatus(inc.id, e.target.value)} className={`text-xs px-2 py-0.5 rounded outline-none font-bold bg-transparent ${statusColors[inc.status]}`}>
                        {['Open','Investigating','Resolved','Classified'].map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
                      </select>
                    ) : <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColors[inc.status]}`}>{inc.status}</span>}
                  </td>
                  <td className="p-3 text-slate-400">{inc.reporter_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}