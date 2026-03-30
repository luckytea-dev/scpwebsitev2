import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Lock, Plus, Save, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ArchivesApp() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadDocs();
    const unsub = base44.entities.Document.subscribe(() => loadDocs());
    return () => unsub();
  }, []);

  const loadDocs = async () => {
    const d = await base44.entities.Document.list('-created_date', 100);
    setDocs(d);
  };

  const handleSave = async () => {
    if (editForm.id) {
      await base44.entities.Document.update(editForm.id, editForm);
    } else {
      await base44.entities.Document.create(editForm);
    }
    setIsEditing(false);
    setSelectedDoc(null);
  };

  const canEdit = currentUser?.is_admin || currentUser?.clearance_level >= 4;

  if (isEditing) {
    return (
      <div className="p-4 h-full flex flex-col text-slate-300">
        <div className="flex justify-between mb-4 items-center">
          <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 hover:text-white transition-colors"><ChevronLeft size={16}/> Back</button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 text-white transition-colors"><Save size={16}/> Save Document</button>
        </div>
        <div className="space-y-4 flex-1 overflow-auto bg-slate-900/50 p-4 rounded border border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Item Number (e.g. SCP-173)" value={editForm.item_number || ''} onChange={e => setEditForm({...editForm, item_number: e.target.value})} className="bg-slate-950 border border-slate-700 p-3 rounded w-full text-white focus:border-slate-500 outline-none" />
            <input placeholder="Title" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="bg-slate-950 border border-slate-700 p-3 rounded w-full text-white focus:border-slate-500 outline-none" />
            <select value={editForm.object_class || 'Safe'} onChange={e => setEditForm({...editForm, object_class: e.target.value})} className="bg-slate-950 border border-slate-700 p-3 rounded w-full text-white focus:border-slate-500 outline-none">
              {['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={editForm.min_clearance_level || 1} onChange={e => setEditForm({...editForm, min_clearance_level: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-700 p-3 rounded w-full text-white focus:border-slate-500 outline-none">
              {[1,2,3,4,5].map(l => <option key={l} value={l}>Level {l} Clearance</option>)}
            </select>
          </div>
          <div className="flex justify-end mb-1">
            <button onClick={() => {
              const url = prompt('Enter Image URL:');
              if(url) setEditForm({...editForm, content: (editForm.content || '') + `\n![Image](${url})\n`});
            }} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white font-bold transition-colors">Add Image</button>
          </div>
          <textarea placeholder="Document Content (Markdown format supported)" value={editForm.content || ''} onChange={e => setEditForm({...editForm, content: e.target.value})} className="bg-slate-950 border border-slate-700 p-3 rounded w-full h-[400px] text-slate-300 font-mono text-sm resize-none focus:border-slate-500 outline-none" />
        </div>
      </div>
    );
  }

  const openDoc = (doc) => {
    setSelectedDoc(doc);
    base44.entities.DispatchLog.create({
      action: 'ARCHIVE_ACCESS',
      message: `Agent ${currentUser?.full_name || 'UNKNOWN'} accessed document ${doc.item_number}`
    });
  };

  if (selectedDoc) {
    if ((currentUser?.clearance_level || 1) < selectedDoc.min_clearance_level) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500 bg-black/50">
          <Lock size={64} className="mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold tracking-widest">ACCESS DENIED</h2>
          <p className="mt-4 text-slate-400 font-mono">CLEARANCE LEVEL {selectedDoc.min_clearance_level} REQUIRED.</p>
          <p className="mt-2 text-red-800 text-xs font-mono uppercase">This incident will be logged.</p>
          <button onClick={() => setSelectedDoc(null)} className="mt-8 border border-red-500 px-6 py-2 hover:bg-red-900/50 text-white font-mono transition-colors">RETURN</button>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col bg-slate-50 p-6 rounded text-slate-900 overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/SCP_Foundation_%28emblem%29.svg" alt="SCP Logo" className="w-64 h-64 filter invert" />
        </div>
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black z-10">
          <button onClick={() => setSelectedDoc(null)} className="flex items-center gap-2 font-bold hover:text-red-700 transition-colors"><ChevronLeft size={16}/> CLOSE DOCUMENT</button>
          {canEdit && (
            <button onClick={() => { setEditForm(selectedDoc); setIsEditing(true); }} className="text-slate-500 hover:text-black text-sm font-bold border border-slate-300 px-3 py-1 rounded">EDIT RECORD</button>
          )}
        </div>
        <div className="flex-1 overflow-auto pr-4 z-10 font-serif pb-8">
          <h1 className="text-4xl font-bold text-black mb-1 font-sans">{selectedDoc.item_number}</h1>
          <h2 className="text-xl text-slate-600 mb-6 italic">{selectedDoc.title}</h2>
          <div className="mb-8 p-4 bg-slate-200 border-l-4 border-black text-sm font-bold flex gap-8">
            <div><span className="text-slate-500 uppercase tracking-widest">Object Class</span><br/><span className="text-lg">{selectedDoc.object_class}</span></div>
            <div><span className="text-slate-500 uppercase tracking-widest">Clearance</span><br/><span className="text-lg">Level {selectedDoc.min_clearance_level}</span></div>
          </div>
          <div className="prose prose-slate max-w-none text-black leading-relaxed font-sans prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-img:rounded-md prose-img:border prose-img:border-black/20 prose-img:shadow-sm">
            <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col text-slate-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-widest">ARCHIVES</h2>
        {canEdit && <button onClick={() => { setEditForm({}); setIsEditing(true); }} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 text-white font-bold transition-colors"><Plus size={16}/> NEW ENTRY</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto pb-4">
        {docs.map(doc => (
          <button
            key={doc.id}
            onClick={() => openDoc(doc)}
            className="flex items-start gap-4 p-5 border border-slate-700 rounded bg-slate-900 hover:bg-slate-800 text-left transition-all hover:border-slate-500 group"
          >
            <div className="mt-1">
              {((currentUser?.clearance_level || 1) < doc.min_clearance_level) 
                ? <Lock className="text-red-500 group-hover:animate-pulse" size={24} /> 
                : <FileText className="text-slate-500 group-hover:text-slate-300" size={24} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-white text-lg tracking-wide">{doc.item_number}</div>
              <div className="text-sm text-slate-400 truncate mt-1 italic">{doc.title}</div>
              <div className="flex gap-3 mt-3">
                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                  doc.object_class === 'Safe' ? 'bg-green-900/30 text-green-400 border border-green-900/50' :
                  doc.object_class === 'Euclid' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50' :
                  doc.object_class === 'Keter' ? 'bg-red-900/30 text-red-400 border border-red-900/50' :
                  doc.object_class === 'Apollyon' ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>{doc.object_class}</span>
                <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">LVL {doc.min_clearance_level}</span>
              </div>
            </div>
          </button>
        ))}
        {docs.length === 0 && <div className="text-slate-600 font-mono col-span-full py-8 text-center border border-dashed border-slate-800 rounded">No records found in database.</div>}
      </div>
    </div>
  );
}