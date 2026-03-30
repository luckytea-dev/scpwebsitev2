import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { UserCheck, Plus, ChevronLeft, AlertTriangle, FileText, Brain, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

const noteTypeIcons = { Note: FileText, Infraction: AlertTriangle, PsychEval: Brain, Medical: Stethoscope };
const noteTypeColors = { Note: 'text-blue-400 bg-blue-900/30 border-blue-800', Infraction: 'text-red-400 bg-red-900/30 border-red-800', PsychEval: 'text-purple-400 bg-purple-900/30 border-purple-800', Medical: 'text-green-400 bg-green-900/30 border-green-800' };
const statusColors = { ACTIVE: 'text-green-400', 'K.I.A': 'text-red-400' };

export default function PersonnelFileApp() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ note_type: 'Note', content: '', severity: 'Info' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadAgents();
    const unsub = base44.entities.AgentAccount.subscribe(() => loadAgents());
    return () => unsub();
  }, []);

  const loadAgents = async () => {
    const data = await base44.entities.AgentAccount.list();
    setAgents(data);
  };

  const selectAgent = async (agent) => {
    setSelected(agent);
    setShowNoteForm(false);
    const n = await base44.entities.PersonnelNote.filter({ agent_id: agent.id }, '-created_date');
    setNotes(n);
  };

  const addNote = async () => {
    await base44.entities.PersonnelNote.create({
      ...noteForm,
      agent_id: selected.id,
      author_name: currentUser?.full_name || 'Admin'
    });
    const n = await base44.entities.PersonnelNote.filter({ agent_id: selected.id }, '-created_date');
    setNotes(n);
    setShowNoteForm(false);
    setNoteForm({ note_type: 'Note', content: '', severity: 'Info' });
  };

  const canEdit = currentUser?.is_admin || currentUser?.clearance_level >= 4;
  const filtered = agents.filter(a => a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.scp_id?.toLowerCase().includes(search.toLowerCase()));

  if (selected) {
    const Icon = noteTypeIcons.Note;
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono overflow-auto">
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"><ChevronLeft size={16}/> RETOUR</button>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-white">DOSSIER PERSONNEL — {selected.full_name}</span>
        </div>

        <div className="flex-1 overflow-auto p-4 grid grid-cols-3 gap-4">
          {/* Left: Identity */}
          <div className="col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-700 rounded p-4">
              <div className="w-24 h-24 rounded border-2 border-slate-600 bg-slate-800 overflow-hidden mx-auto mb-3 flex items-center justify-center">
                {selected.avatar_url ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserCheck size={32} className="text-slate-600" />}
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">{selected.full_name}</div>
                <div className="text-xs text-slate-400 mt-1">ID: {selected.scp_id}</div>
                <div className={`font-bold mt-2 ${statusColors[selected.status] || 'text-slate-400'}`}>{selected.status || 'ACTIVE'}</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Clearance</span><span className="text-red-400 font-bold">LEVEL {selected.clearance_level || 1}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rang</span><span className="text-white">{selected.rank || 'Recrue'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Département</span><span className="text-white text-right max-w-[150px]">{selected.department || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">MTF</span><span className="text-white">{selected.mtf_unit_id || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Présence</span><span className={selected.presence === 'ONLINE' ? 'text-green-400' : selected.presence === 'ON_MISSION' ? 'text-red-400' : 'text-slate-400'}>{selected.presence || 'OFFLINE'}</span></div>
            </div>
          </div>

          {/* Right: Notes / Infractions */}
          <div className="col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white">DOSSIER ADMINISTRATIF</h3>
              {canEdit && <button onClick={() => setShowNoteForm(!showNoteForm)} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-600 text-white"><Plus size={12}/> AJOUTER ENTRÉE</button>}
            </div>

            {showNoteForm && (
              <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={noteForm.note_type} onChange={e => setNoteForm({...noteForm, note_type: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm">
                    {['Note','Infraction','PsychEval','Medical'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={noteForm.severity} onChange={e => setNoteForm({...noteForm, severity: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm">
                    {['Info','Warning','Critical'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} placeholder="Contenu de l'entrée..." className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm h-24 resize-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNoteForm(false)} className="px-3 py-1.5 border border-slate-700 rounded text-sm hover:bg-slate-800">Annuler</button>
                  <button onClick={addNote} className="px-3 py-1.5 bg-slate-200 text-black rounded font-bold hover:bg-white text-sm">ENREGISTRER</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {notes.map(note => {
                const NoteIcon = noteTypeIcons[note.note_type] || FileText;
                return (
                  <div key={note.id} className={`border rounded p-4 ${noteTypeColors[note.note_type] || 'text-slate-400 bg-slate-900/30 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <NoteIcon size={14} />
                        <span className="font-bold text-sm uppercase">{note.note_type}</span>
                        {note.severity === 'Critical' && <span className="text-xs bg-red-900 text-red-300 px-1 rounded">CRITIQUE</span>}
                        {note.severity === 'Warning' && <span className="text-xs bg-yellow-900 text-yellow-300 px-1 rounded">AVERTISSEMENT</span>}
                      </div>
                      <span className="text-xs opacity-60">{format(new Date(note.created_date), 'dd/MM/yyyy')} — {note.author_name}</span>
                    </div>
                    <p className="text-sm opacity-90">{note.content}</p>
                  </div>
                );
              })}
              {notes.length === 0 && <div className="text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded">AUCUNE ENTRÉE AU DOSSIER</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono">
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <h2 className="font-bold text-white flex items-center gap-2 mb-3"><UserCheck size={18} className="text-blue-400"/> DOSSIERS PERSONNEL</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou ID..." className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none text-sm" />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700 text-slate-500 text-left bg-slate-900 sticky top-0">
            <th className="p-3">Agent</th><th className="p-3">Clearance</th><th className="p-3">Rang</th><th className="p-3">Département</th><th className="p-3">Statut</th>
          </tr></thead>
          <tbody>
            {filtered.map(agent => (
              <tr key={agent.id} onClick={() => selectAgent(agent)} className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors">
                <td className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {agent.avatar_url ? <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserCheck size={14} className="text-slate-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">{agent.full_name}</div>
                    <div className="text-xs text-slate-500">{agent.scp_id}</div>
                  </div>
                </td>
                <td className="p-3"><span className="text-red-400 font-bold text-xs">L{agent.clearance_level || 1}</span></td>
                <td className="p-3 text-slate-300">{agent.rank || 'Recrue'}</td>
                <td className="p-3 text-slate-400 text-xs">{agent.department || '—'}</td>
                <td className="p-3"><span className={`font-bold text-xs ${statusColors[agent.status] || 'text-green-400'}`}>{agent.status || 'ACTIVE'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}