import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Plus } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function NewsApp() {
  const [news, setNews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadNews();
    const unsub = base44.entities.Announcement.subscribe(() => loadNews());
    return () => unsub();
  }, []);

  const loadNews = async () => {
    const n = await base44.entities.Announcement.list('-created_date', 20);
    setNews(n);
  };

  const handlePost = async () => {
    await base44.entities.Announcement.create({...form, author_name: currentUser?.full_name || 'SYSTEM'});
    setIsComposing(false);
    setForm({ title: '', content: '' });
  };

  const canPost = currentUser?.is_admin || currentUser?.clearance_level >= 3;

  if (isComposing) {
    return (
      <div className="flex flex-col h-full space-y-4 text-slate-300">
        <h2 className="text-xl font-bold tracking-widest">NEW GLOBAL ANNOUNCEMENT</h2>
        <input placeholder="Headline" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none" />
        <div className="flex justify-end">
            <button onClick={() => {
              const url = prompt('Enter Image URL:');
              if(url) setForm({...form, content: (form.content || '') + `\n![Image](${url})\n`});
            }} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white font-bold transition-colors">Add Image</button>
        </div>
        <textarea placeholder="Announcement Body (Markdown)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded text-white resize-none font-mono text-sm focus:border-slate-500 outline-none" />
        <div className="flex gap-3 justify-end">
          <button onClick={() => setIsComposing(false)} className="px-6 py-2 border border-slate-700 rounded hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handlePost} className="px-6 py-2 bg-slate-200 text-slate-900 rounded hover:bg-white font-bold transition-colors">Broadcast</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold flex items-center gap-2 tracking-widest"><Globe /> GLOBAL NETWORK</h2>
        {canPost && <button onClick={() => setIsComposing(true)} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 text-white font-bold transition-colors"><Plus size={16}/> PUBLISH</button>}
      </div>
      
      <div className="flex-1 overflow-auto space-y-6 pb-4">
        {news.map(item => (
          <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-800">
              <h3 className="text-2xl font-bold text-white tracking-wide">{item.title}</h3>
              <div className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">{format(new Date(item.created_date), 'yyyy-MM-dd HH:mm')}</div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-serif leading-relaxed">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">ISSUED BY: {item.author_name || 'SYSTEM'}</div>
                {canPost && <button onClick={() => base44.entities.Announcement.delete(item.id)} className="text-red-500 hover:text-red-400 text-xs font-bold bg-red-900/20 px-2 py-1 rounded">DELETE</button>}
              </div>
              <div className="h-1 w-12 bg-red-900/50 rounded-full"></div>
            </div>
          </div>
        ))}
        {news.length === 0 && <div className="text-slate-600 text-center py-12 border border-dashed border-slate-800 rounded font-mono">NO BROADCASTS DETECTED.</div>}
      </div>
    </div>
  );
}