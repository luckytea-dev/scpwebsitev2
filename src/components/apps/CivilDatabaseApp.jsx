import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, X, User, AlertTriangle, Shield } from 'lucide-react';

const STATUS_COLORS = {
  Normal: 'bg-green-900/50 text-green-400',
  Surveillance: 'bg-yellow-900/50 text-yellow-400',
  Detention: 'bg-orange-900/50 text-orange-400',
  Released: 'bg-slate-700 text-slate-400',
  Wanted: 'bg-red-900/50 text-red-400 animate-pulse'
};

const THREAT_COLORS = {
  None: 'text-slate-500',
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-orange-400',
  Extreme: 'text-red-500 font-bold'
};

export default function CivilDatabaseApp() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '', nationality: '', status: 'Normal', threat_level: 'None', notes: '', photo_url: '', linked_scp: '', mtf_assigned: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadRecords();
    const unsub = base44.entities.CivilRecord.subscribe(() => loadRecords());
    return () => unsub();
  }, []);

  const loadRecords = async () => {
    const r = await base44.entities.CivilRecord.list('-updated_date', 100);
    setRecords(r);
  };

  const filteredRecords = records.filter(r =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = async () => {
    await base44.entities.CivilRecord.create(form);
    setCreating(false);
    setForm({ first_name: '', last_name: '', date_of_birth: '', nationality: '', status: 'Normal', threat_level: 'None', notes: '', photo_url: '', linked_scp: '', mtf_assigned: '' });
  };

  const handleDelete = async (id) => {
    await base44.entities.CivilRecord.delete(id);
    setSelected(null);
  };

  const isAdmin = (currentUser?.clearance_level || 1) >= 3;

  return (
    <div className="flex h-full bg-slate-950 text-slate-300 font-mono">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-blue-400" />
            <span className="font-bold text-white text-sm tracking-widest">CIVIL DATABASE</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un civil..."
              className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-600"
            />
          </div>
          {isAdmin && (
            <button onClick={() => setCreating(true)} className="mt-3 w-full bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700 text-blue-300 text-xs py-2 rounded flex items-center justify-center gap-2">
              <Plus size={12} /> Nouvelle fiche
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-2">
          {filteredRecords.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left p-3 rounded mb-1 border transition-colors ${selected?.id === r.id ? 'bg-blue-900/30 border-blue-700' : 'border-transparent hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{r.last_name}, {r.first_name}</span>
                {r.status === 'Wanted' && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
              </div>
              <div className="flex gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || 'bg-slate-800 text-slate-400'}`}>{r.status}</span>
              </div>
            </button>
          ))}
          {filteredRecords.length === 0 && <div className="text-slate-600 text-xs text-center mt-8">Aucun résultat</div>}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 flex flex-col">
        {creating ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-widest">NOUVELLE FICHE CIVILE</h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {[['first_name','Prénom'],['last_name','Nom'],['date_of_birth','Date de naissance'],['nationality','Nationalité'],['photo_url','Photo URL'],['linked_scp','Dossier SCP lié'],['mtf_assigned','MTF assignée']].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">{label}</label>
                  <input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none" />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none">
                  {['Normal','Surveillance','Detention','Released','Wanted'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Niveau de menace</label>
                <select value={form.threat_level} onChange={e => setForm({...form, threat_level: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none">
                  {['None','Low','Medium','High','Extreme'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none resize-none" />
              </div>
            </div>
            <button onClick={handleCreate} className="mt-6 bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm">ENREGISTRER</button>
          </div>
        ) : selected ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-slate-500 tracking-widest mb-1">DOSSIER #{selected.id?.slice(0,8).toUpperCase()}</div>
                <h2 className="text-3xl font-bold text-white">{selected.last_name.toUpperCase()}, {selected.first_name}</h2>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(selected.id)} className="text-red-500 hover:text-red-400 border border-red-900 px-3 py-1 rounded text-xs">SUPPRIMER</button>
              )}
            </div>
            {selected.photo_url && (
              <div className="w-32 h-32 border border-slate-700 rounded mb-6 overflow-hidden bg-slate-800">
                <img src={selected.photo_url} alt="Photo" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <div><div className="text-xs text-slate-500 mb-1">STATUT</div><span className={`px-3 py-1 rounded text-sm font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
              <div><div className="text-xs text-slate-500 mb-1">NIVEAU DE MENACE</div><span className={`text-sm font-bold ${THREAT_COLORS[selected.threat_level]}`}>▲ {selected.threat_level}</span></div>
              <div><div className="text-xs text-slate-500 mb-1">DATE DE NAISSANCE</div><div className="text-white">{selected.date_of_birth || '—'}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">NATIONALITÉ</div><div className="text-white">{selected.nationality || '—'}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">DOSSIER SCP LIÉ</div><div className="text-white">{selected.linked_scp || '—'}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">MTF ASSIGNÉE</div><div className="text-white">{selected.mtf_assigned || '—'}</div></div>
              {selected.notes && (
                <div className="col-span-2"><div className="text-xs text-slate-500 mb-1">NOTES</div><div className="bg-slate-900 border border-slate-700 rounded p-3 text-sm text-white whitespace-pre-wrap">{selected.notes}</div></div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col gap-4">
            <User size={64} />
            <div className="text-sm tracking-widest">SÉLECTIONNER UN DOSSIER</div>
          </div>
        )}
      </div>
    </div>
  );
}