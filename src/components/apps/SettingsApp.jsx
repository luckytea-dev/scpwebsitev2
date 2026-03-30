import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, User, Save, Bell, Lock, Monitor } from 'lucide-react';

export default function SettingsApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', avatar_url: '', theme: 'dark', language: 'fr', ui_sounds: true, mdt_name: '', mdt_id: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) {
       base44.entities.AgentAccount.list().then(accs => {
          const u = accs.find(a => a.id === id);
          if (u) {
            setCurrentUser(u);
            setForm({
              full_name: u.full_name || '',
              avatar_url: u.avatar_url || '',
              theme: u.theme || 'dark',
              language: u.language || 'fr',
              ui_sounds: u.ui_sounds ?? true,
              mdt_name: u.mdt_name || '',
              mdt_id: u.mdt_id || ''
            });
          }
       });
    }
    const unsub = base44.entities.AgentAccount.subscribe(() => {
       if (id) {
         base44.entities.AgentAccount.list().then(accs => {
            const u = accs.find(a => a.id === id);
            if (u) setCurrentUser(u);
         });
       }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser) await base44.entities.AgentAccount.update(currentUser.id, form);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-full text-slate-300">
      <div className="w-48 border-r border-slate-800 bg-slate-900/50 flex flex-col p-4 space-y-2">
        <button onClick={() => setActiveTab('identity')} className={`flex items-center gap-2 p-2 rounded ${activeTab === 'identity' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><User size={16}/> Identity</button>
        <button onClick={() => setActiveTab('system')} className={`flex items-center gap-2 p-2 rounded ${activeTab === 'system' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><SettingsIcon size={16}/> System</button>
        <button onClick={() => setActiveTab('audio')} className={`flex items-center gap-2 p-2 rounded ${activeTab === 'audio' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><Bell size={16}/> Audio</button>
        <button onClick={() => setActiveTab('mdt')} className={`flex items-center gap-2 p-2 rounded ${activeTab === 'mdt' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><Monitor size={16}/> MDT</button>
      </div>
      <div className="flex-1 p-8 overflow-auto bg-slate-950">
        <form onSubmit={handleSave} className="max-w-md space-y-6">
          {activeTab === 'identity' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">User Identity</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Designation (RP Name)</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Identification Photo URL</label>
                <input value={form.avatar_url} onChange={e => setForm({...form, avatar_url: e.target.value})} placeholder="https://example.com/avatar.png" className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none" />
                {form.avatar_url && (
                  <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-slate-600 bg-slate-800">
                    <img src={form.avatar_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">System Preferences</h2>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Terminal Theme</label>
                <select value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white outline-none">
                  <option value="dark">Secure Dark (Standard)</option>
                  <option value="light">Lab White (Medical)</option>
                  <option value="terminal">Retro Green Terminal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Language</label>
                <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white outline-none">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'audio' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Audio & Notifications</h2>
              <div className="flex items-center justify-between bg-slate-900 p-4 border border-slate-700 rounded">
                <span className="font-bold text-slate-300">Terminal UI Sounds</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.ui_sounds} onChange={e => setForm({...form, ui_sounds: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </>
          )}

          {activeTab === 'mdt' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Configuration MDT</h2>
              <div className="bg-slate-900/50 border border-slate-700 rounded p-4 mb-4 flex items-center gap-3">
                <Lock size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">ID INTERNE SYSTÈME (non modifiable)</div>
                  <div className="font-bold text-white font-mono">{currentUser?.id}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Nom affiché MDT</label>
                  <input value={form.mdt_name} onChange={e => setForm({...form, mdt_name: e.target.value})} placeholder="Ex: AGENT-DUCHAMP" className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Identifiant MDT</label>
                  <input value={form.mdt_id} onChange={e => setForm({...form, mdt_id: e.target.value})} placeholder="Ex: MTF-E11-07" className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none font-mono" />
                  <div className="text-xs text-slate-600">Cet identifiant est visible dans le réseau MTF et le dispatch.</div>
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-slate-200 text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors mt-8">
            <Save size={18} /> {saving ? 'SAVING...' : 'APPLY SETTINGS'}
          </button>
        </form>
      </div>
    </div>
  );
}