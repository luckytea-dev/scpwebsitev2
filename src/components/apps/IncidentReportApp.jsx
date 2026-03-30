import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Plus, X, Upload, PenLine, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SEVERITY_COLORS = {
  Minor: 'bg-blue-900/50 text-blue-400',
  Moderate: 'bg-yellow-900/50 text-yellow-400',
  Major: 'bg-orange-900/50 text-orange-400',
  Critical: 'bg-red-900/50 text-red-400 animate-pulse'
};

export default function IncidentReportApp() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'Minor', linked_scp: '', image_url: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => {
      const u = a.find(x => x.id === id);
      setCurrentUser(u);
    });
    loadReports();
    const unsub = base44.entities.IncidentReport.subscribe(() => loadReports());
    return () => unsub();
  }, []);

  const loadReports = async () => {
    const r = await base44.entities.IncidentReport.list('-created_date', 50);
    setReports(r);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleCreate = async () => {
    await base44.entities.IncidentReport.create({
      ...form,
      reporter_id: currentUser?.id,
      reporter_name: currentUser?.full_name || currentUser?.scp_id,
      signature: `${currentUser?.scp_id} — ${new Date().toISOString()}`
    });
    setCreating(false);
    setForm({ title: '', description: '', severity: 'Minor', linked_scp: '', image_url: '' });
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-300 font-mono">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="font-bold text-white text-sm tracking-widest">INCIDENT REPORTS</span>
          </div>
          <button onClick={() => setCreating(true)} className="w-full bg-red-900/40 hover:bg-red-800/50 border border-red-700 text-red-300 text-xs py-2 rounded flex items-center justify-center gap-2">
            <Plus size={12} /> Nouveau rapport
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {reports.map(r => (
            <button key={r.id} onClick={() => { setSelected(r); setCreating(false); }} className={`w-full text-left p-3 rounded mb-1 border transition-colors ${selected?.id === r.id ? 'bg-red-900/20 border-red-700' : 'border-transparent hover:bg-slate-800/50'}`}>
              <div className="font-bold text-sm text-white truncate">{r.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
                <span className="text-[10px] text-slate-500">{r.reporter_name}</span>
              </div>
              {r.created_date && <div className="text-[10px] text-slate-600 mt-1"><Clock size={8} className="inline mr-1" />{format(new Date(r.created_date), 'dd/MM HH:mm')}</div>}
            </button>
          ))}
          {reports.length === 0 && <div className="text-slate-600 text-xs text-center mt-8">Aucun rapport</div>}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {creating ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-3"><PenLine size={20} className="text-red-400"/> RAPPORT D'INCIDENT</h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="max-w-2xl space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Titre de l'incident</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Sévérité</label>
                  <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none">
                    {['Minor','Moderate','Major','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Dossier SCP lié</label>
                  <input value={form.linked_scp} onChange={e => setForm({...form, linked_scp: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Description détaillée</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase">Preuve photographique</label>
                <label className="flex items-center gap-3 bg-slate-900 border border-dashed border-slate-600 rounded p-4 cursor-pointer hover:border-slate-400 transition-colors">
                  <Upload size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-400">{uploading ? 'Chargement...' : form.image_url ? 'Image chargée ✓' : 'Cliquer pour uploader'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 max-h-32 rounded border border-slate-700" />}
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-500">
                <div>Rapporteur : <span className="text-white">{currentUser?.full_name} ({currentUser?.scp_id})</span></div>
                <div>Signature : <span className="text-green-400 font-mono">{currentUser?.scp_id} — {new Date().toISOString()}</span></div>
              </div>
              <button onClick={handleCreate} className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded font-bold text-sm">SOUMETTRE LE RAPPORT</button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="text-xs text-slate-500 mb-1 tracking-widest">RAPPORT #{selected.id?.slice(0,8).toUpperCase()}</div>
              <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
              <div className="flex gap-3 mt-2">
                <span className={`px-3 py-1 rounded text-sm font-bold ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
                {selected.linked_scp && <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-sm">SCP: {selected.linked_scp}</span>}
              </div>
            </div>
            {selected.image_url && <img src={selected.image_url} alt="Preuve" className="max-h-48 rounded border border-slate-700 mb-6" />}
            <div className="bg-slate-900 border border-slate-700 rounded p-4 text-sm text-white whitespace-pre-wrap mb-4">{selected.description}</div>
            <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
              <div>Rapporteur : <span className="text-white">{selected.reporter_name}</span></div>
              <div>Signature : <span className="text-green-400 font-mono">{selected.signature}</span></div>
              {selected.created_date && <div>Date : <span className="text-white">{format(new Date(selected.created_date), 'dd/MM/yyyy HH:mm:ss')}</span></div>}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col gap-4">
            <AlertTriangle size={64} />
            <div className="text-sm tracking-widest">SÉLECTIONNER UN RAPPORT</div>
          </div>
        )}
      </div>
    </div>
  );
}