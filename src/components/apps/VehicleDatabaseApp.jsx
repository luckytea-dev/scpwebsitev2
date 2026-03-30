import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, X, Car, AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
  Normal: 'bg-green-900/50 text-green-400',
  Wanted: 'bg-red-900/50 text-red-400 animate-pulse',
  Seized: 'bg-orange-900/50 text-orange-400',
  Flagged: 'bg-yellow-900/50 text-yellow-400'
};

export default function VehicleDatabaseApp() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ plate: '', make: '', model: '', color: '', owner_name: '', status: 'Normal', notes: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadRecords();
    const unsub = base44.entities.VehicleRecord.subscribe(() => loadRecords());
    return () => unsub();
  }, []);

  const loadRecords = async () => {
    const r = await base44.entities.VehicleRecord.list('-updated_date', 100);
    setRecords(r);
  };

  const filteredRecords = records.filter(r =>
    `${r.plate} ${r.make} ${r.model} ${r.owner_name}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = async () => {
    await base44.entities.VehicleRecord.create(form);
    setCreating(false);
    setForm({ plate: '', make: '', model: '', color: '', owner_name: '', status: 'Normal', notes: '' });
  };

  const handleDelete = async (id) => {
    await base44.entities.VehicleRecord.delete(id);
    setSelected(null);
  };

  const isAdmin = (currentUser?.clearance_level || 1) >= 2;

  return (
    <div className="flex h-full bg-slate-950 text-slate-300 font-mono">
      <div className="w-72 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Car size={16} className="text-yellow-400" />
            <span className="font-bold text-white text-sm tracking-widest">VÉHICULES</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Plaque, propriétaire..." className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-yellow-600" />
          </div>
          {isAdmin && (
            <button onClick={() => setCreating(true)} className="mt-3 w-full bg-yellow-900/30 hover:bg-yellow-800/40 border border-yellow-700 text-yellow-300 text-xs py-2 rounded flex items-center justify-center gap-2">
              <Plus size={12} /> Nouveau véhicule
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-2">
          {filteredRecords.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} className={`w-full text-left p-3 rounded mb-1 border transition-colors ${selected?.id === r.id ? 'bg-yellow-900/20 border-yellow-700' : 'border-transparent hover:bg-slate-800/50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm tracking-widest">{r.plate}</span>
                {r.status === 'Wanted' && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{r.make} {r.model} — {r.owner_name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            </button>
          ))}
          {filteredRecords.length === 0 && <div className="text-slate-600 text-xs text-center mt-8">Aucun résultat</div>}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {creating ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-widest">NOUVEAU VÉHICULE</h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {[['plate','Plaque d\'immatriculation'],['make','Marque'],['model','Modèle'],['color','Couleur'],['owner_name','Propriétaire']].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">{label}</label>
                  <input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none" />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none">
                  {['Normal','Wanted','Seized','Flagged'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none resize-none" />
              </div>
            </div>
            <button onClick={handleCreate} className="mt-6 bg-yellow-800 hover:bg-yellow-700 text-white px-6 py-2 rounded font-bold text-sm">ENREGISTRER</button>
          </div>
        ) : selected ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-slate-500 tracking-widest mb-1">PLAQUE D'IMMATRICULATION</div>
                <h2 className="text-4xl font-bold text-white tracking-widest">{selected.plate}</h2>
              </div>
              {isAdmin && <button onClick={() => handleDelete(selected.id)} className="text-red-500 hover:text-red-400 border border-red-900 px-3 py-1 rounded text-xs">SUPPRIMER</button>}
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <div><div className="text-xs text-slate-500 mb-1">STATUT</div><span className={`px-3 py-1 rounded text-sm font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
              <div><div className="text-xs text-slate-500 mb-1">PROPRIÉTAIRE</div><div className="text-white">{selected.owner_name || '—'}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">MARQUE / MODÈLE</div><div className="text-white">{selected.make} {selected.model}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">COULEUR</div><div className="text-white">{selected.color || '—'}</div></div>
              {selected.notes && <div className="col-span-2"><div className="text-xs text-slate-500 mb-1">NOTES</div><div className="bg-slate-900 border border-slate-700 rounded p-3 text-sm text-white whitespace-pre-wrap">{selected.notes}</div></div>}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col gap-4">
            <Car size={64} />
            <div className="text-sm tracking-widest">SÉLECTIONNER UN VÉHICULE</div>
          </div>
        )}
      </div>
    </div>
  );
}