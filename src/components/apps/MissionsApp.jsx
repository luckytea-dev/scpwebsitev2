import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Plus, ChevronLeft, Flag } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = { Planned: 'bg-blue-900/40 text-blue-400 border-blue-800', Active: 'bg-yellow-900/40 text-yellow-400 border-yellow-800 animate-pulse', Completed: 'bg-green-900/40 text-green-400 border-green-800', Failed: 'bg-red-900/40 text-red-400 border-red-800' };
const dangerColors = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Extreme: 'text-red-400' };

export default function MissionsApp() {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [logEntry, setLogEntry] = useState('');
  const [form, setForm] = useState({ title: '', description: '', unit_assigned: '', agents_assigned: '', status: 'Planned', danger_level: 'Medium', location: '', start_date: '', end_date: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadMissions();
    const unsub = base44.entities.Mission.subscribe(() => loadMissions());
    return () => unsub();
  }, []);

  const loadMissions = async () => {
    const data = await base44.entities.Mission.list('-created_date', 50);
    setMissions(data);
    if (selected) setSelected(data.find(m => m.id === selected.id) || null);
  };

  const createMission = async () => {
    await base44.entities.Mission.create({ ...form, created_by_name: currentUser?.full_name || 'Admin' });
    setShowForm(false);
    setForm({ title: '', description: '', unit_assigned: '', agents_assigned: '', status: 'Planned', danger_level: 'Medium', location: '', start_date: '', end_date: '' });
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Mission.update(id, { status });
  };

  const addLogEntry = async () => {
    if (!logEntry.trim() || !selected) return;
    const ts = format(new Date(), 'dd/MM/yyyy HH:mm');
    const newLog = `[${ts}] ${currentUser?.full_name || 'Admin'}: ${logEntry}\n${selected.mission_log || ''}`;
    await base44.entities.Mission.update(selected.id, { mission_log: newLog });
    setLogEntry('');
  };

  const canEdit = currentUser?.is_admin || currentUser?.clearance_level >= 3;

  if (selected) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono overflow-auto">
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"><ChevronLeft size={16}/> RETOUR</button>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-white uppercase">{selected.title}</span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded border font-bold ${statusColors[selected.status]}`}>{selected.status}</span>
        </div>
        <div className="flex-1 overflow-auto p-4 grid grid-cols-3 gap-4">
          <div className="col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-3 text-sm">
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Localisation</span><span className="text-white">{selected.location || '—'}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Unité assignée</span><span className="text-white">{selected.unit_assigned || '—'}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Agents</span><span className="text-white">{selected.agents_assigned || '—'}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Danger</span><span className={`font-bold ${dangerColors[selected.danger_level]}`}>{selected.danger_level}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Début</span><span className="text-white">{selected.start_date || '—'}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Fin prévue</span><span className="text-white">{selected.end_date || '—'}</span></div>
              <div><span className="text-slate-500 block text-xs uppercase mb-1">Créé par</span><span className="text-white">{selected.created_by_name}</span></div>
            </div>
            {canEdit && (
              <div className="bg-slate-900 border border-slate-700 rounded p-4">
                <div className="text-xs text-slate-500 uppercase mb-2">Modifier le statut</div>
                <div className="space-y-1">
                  {['Planned','Active','Completed','Failed'].map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold border transition-all ${selected.status === s ? statusColors[s] : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-700 rounded p-4">
              <div className="text-xs text-slate-500 uppercase mb-2">Description</div>
              <p className="text-sm text-slate-300">{selected.description || 'Aucune description.'}</p>
            </div>
            {selected.report && (
              <div className="bg-slate-900 border border-slate-700 rounded p-4">
                <div className="text-xs text-slate-500 uppercase mb-2">Rapport</div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.report}</p>
              </div>
            )}
            <div className="bg-slate-900 border border-slate-700 rounded p-4">
              <div className="text-xs text-slate-500 uppercase mb-3">Journal d'Événements</div>
              <div className="bg-slate-950 border border-slate-800 rounded p-3 h-48 overflow-auto font-mono text-xs text-green-400 mb-3 whitespace-pre-wrap">
                {selected.mission_log || '// Aucune entrée\n'}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input value={logEntry} onChange={e => setLogEntry(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLogEntry()} placeholder="Ajouter une entrée journal..." className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
                  <button onClick={addLogEntry} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-bold">LOG</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <h2 className="font-bold text-white flex items-center gap-2"><Target size={18} className="text-yellow-400"/> MISSIONS & DISPATCH</h2>
        {canEdit && <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700 px-3 py-1.5 rounded text-white text-sm font-bold"><Plus size={14}/> NOUVELLE MISSION</button>}
      </div>

      {showForm && (
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-2 gap-3 max-w-3xl">
            <input placeholder="Titre de la mission" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm h-16 resize-none" />
            <input placeholder="Unité assignée" value={form.unit_assigned} onChange={e => setForm({...form, unit_assigned: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <input placeholder="Agents assignés" value={form.agents_assigned} onChange={e => setForm({...form, agents_assigned: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <input placeholder="Localisation" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <select value={form.danger_level} onChange={e => setForm({...form, danger_level: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm">
              {['Low','Medium','High','Extreme'].map(d => <option key={d}>{d}</option>)}
            </select>
            <input placeholder="Date de début" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <input placeholder="Date de fin prévue" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
            <div className="col-span-2 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-700 rounded hover:bg-slate-800 text-sm">Annuler</button>
              <button onClick={createMission} className="px-4 py-1.5 bg-slate-200 text-black rounded font-bold hover:bg-white text-sm">DÉPLOYER</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {missions.map(m => (
          <div key={m.id} onClick={() => setSelected(m)} className="bg-slate-900 border border-slate-700 rounded p-4 cursor-pointer hover:border-slate-500 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-white group-hover:text-yellow-300 transition-colors">{m.title}</div>
              <span className={`text-xs px-2 py-0.5 rounded border font-bold ${statusColors[m.status]}`}>{m.status}</span>
            </div>
            <div className="text-xs text-slate-500 mb-2">{m.location && `📍 ${m.location}`}</div>
            <div className="flex gap-4 text-xs">
              <span className="text-slate-500">Unité: <span className="text-slate-300">{m.unit_assigned || '—'}</span></span>
              <span className="text-slate-500">Danger: <span className={dangerColors[m.danger_level]}>{m.danger_level}</span></span>
            </div>
            <div className="text-xs text-slate-600 mt-2">{format(new Date(m.created_date), 'dd/MM/yyyy')} — {m.created_by_name}</div>
          </div>
        ))}
        {missions.length === 0 && <div className="col-span-2 text-center text-slate-600 py-16 border border-dashed border-slate-800 rounded">AUCUNE MISSION ENREGISTRÉE</div>}
      </div>
    </div>
  );
}