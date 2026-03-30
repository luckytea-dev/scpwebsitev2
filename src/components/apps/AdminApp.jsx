import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Users, ShieldAlert, Activity, Building, Crosshair } from 'lucide-react';
import { format } from 'date-fns';

const ranksByLevel = {
  1: ["Recrue", "Opérateur", "Caporal", "Caporal-Chef"],
  2: ["Sergent de la FIM", "Sergent-Chef de la FIM", "Adjudant", "Adjudant-Chef", "Major"],
  3: ["Aspirant", "Sous-Lieutenant", "Lieutenant"],
  4: ["Capitaine", "Commandant", "Lieutenant-Colonel", "Colonel"],
  5: ["Directeur Adjoint", "Directeur de la FIM", "Superviseur de la FIM"]
};

export default function AdminApp() {
  const [tab, setTab] = useState('personnel');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [mtfUnits, setMtfUnits] = useState([]);
  const [siteStatus, setSiteStatus] = useState('Normal');
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [recruitForm, setRecruitForm] = useState({ scp_id: '', password: '', full_name: '', clearance_level: 1, rank: 'Recrue', is_admin: false });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadData();
    const unsubStatus = base44.entities.SiteStatus.subscribe(() => loadData());
    const unsubUsers = base44.entities.AgentAccount.subscribe(() => loadData());
    const unsubLogs = base44.entities.DispatchLog.subscribe(() => loadData());
    const unsubDepts = base44.entities.Department.subscribe(() => loadData());
    const unsubMtf = base44.entities.MTFUnit.subscribe(() => loadData());
    return () => { unsubStatus(); unsubUsers(); unsubLogs(); unsubDepts(); unsubMtf(); };
  }, []);

  const loadData = async () => {
    const u = await base44.entities.AgentAccount.list();
    setUsers(u);
    const s = await base44.entities.SiteStatus.list();
    if (s.length > 0) setSiteStatus(s[0].level);
    const l = await base44.entities.DispatchLog.list('-created_date', 50);
    setLogs(l);

    let depts = await base44.entities.Department.list();
    if (depts.length === 0) {
      await base44.entities.Department.create({ name: "Comité d'Éthique" });
      await base44.entities.Department.create({ name: "Département Scientifique" });
      await base44.entities.Department.create({ name: "Département de la Sécurité" });
      depts = await base44.entities.Department.list();
    }
    setDepartments(depts);

    let mtfs = await base44.entities.MTFUnit.list();
    if (mtfs.length === 0) {
      await base44.entities.MTFUnit.create({ name: "Alpha-1 'Red Right Hand'" });
      await base44.entities.MTFUnit.create({ name: "Omega-1 'Law's Left Hand'" });
      await base44.entities.MTFUnit.create({ name: "Sigma-9 'Valkyries'" });
      await base44.entities.MTFUnit.create({ name: "Nu-7 'Hammer Down'" });
      mtfs = await base44.entities.MTFUnit.list();
    }
    
    // Auto-create channels for existing MTF units if missing
    const mtfChannels = await base44.entities.MTFChannel.list();
    for (const m of mtfs) {
      if (!mtfChannels.find(c => c.category === m.name && c.name.startsWith('Discussion'))) {
        await base44.entities.MTFChannel.create({ name: 'Discussion - ' + m.name, category: m.name, min_clearance: 1, mtf_unit_id: m.name });
      }
      if (!mtfChannels.find(c => c.category === m.name && c.name.startsWith('Rapport'))) {
        await base44.entities.MTFChannel.create({ name: 'Rapport - ' + m.name, category: m.name, min_clearance: 1, mtf_unit_id: m.name });
      }
    }
    
    setMtfUnits(mtfs);
  };

  const updateStatus = async (level) => {
    const s = await base44.entities.SiteStatus.list();
    if (s.length > 0) {
      await base44.entities.SiteStatus.update(s[0].id, { level });
    } else {
      await base44.entities.SiteStatus.create({ level, description: 'Updated by Admin' });
    }
    base44.entities.DispatchLog.create({ action: 'STATUS_CHANGE', message: `Site status updated to ${level}` });
  };

  const updateUser = async (id, data) => {
    await base44.entities.AgentAccount.update(id, data);
  };

  if (!currentUser?.is_admin && currentUser?.clearance_level < 5) {
    return <div className="p-8 text-red-500 font-bold text-center h-full flex items-center justify-center text-2xl tracking-widest">ACCESS DENIED.<br/>CLEARANCE LEVEL 5 REQUIRED.</div>;
  }

  return (
    <div className="flex h-full text-slate-300">
      <div className="w-48 border-r border-slate-700 bg-slate-900/50 flex flex-col">
        <button onClick={() => setTab('personnel')} className={`p-3 text-left hover:bg-slate-800 transition-colors ${tab === 'personnel' ? 'bg-slate-800 border-l-2 border-slate-400 text-white' : ''}`}>Personnel</button>
        <button onClick={() => setTab('status')} className={`p-3 text-left hover:bg-slate-800 transition-colors ${tab === 'status' ? 'bg-slate-800 border-l-2 border-slate-400 text-white' : ''}`}>Site Status</button>
        <button onClick={() => setTab('logs')} className={`p-3 text-left hover:bg-slate-800 transition-colors ${tab === 'logs' ? 'bg-slate-800 border-l-2 border-slate-400 text-white' : ''}`}>System Logs</button>
        <button onClick={() => setTab('departments')} className={`p-3 text-left hover:bg-slate-800 transition-colors ${tab === 'departments' ? 'bg-slate-800 border-l-2 border-slate-400 text-white' : ''}`}>Départements</button>
        <button onClick={() => setTab('mtf')} className={`p-3 text-left hover:bg-slate-800 transition-colors ${tab === 'mtf' ? 'bg-slate-800 border-l-2 border-slate-400 text-white' : ''}`}>F.I.M</button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {tab === 'personnel' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users /> Personnel Database</h2>
            <div className="overflow-x-auto bg-slate-900/50 border border-slate-800 rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-slate-500 bg-slate-900">
                    <th className="p-3">Name</th>
                    <th className="p-3">Clearance</th>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Dept & MTF</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-3 flex flex-col gap-1">
                        <input value={u.full_name || ''} onChange={(e) => updateUser(u.id, { full_name: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs w-full" placeholder="Nom" />
                        <input value={u.scp_id || ''} onChange={(e) => updateUser(u.id, { scp_id: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs w-full" placeholder="ID" />
                        <input value={u.password || ''} onChange={(e) => updateUser(u.id, { password: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs w-full" placeholder="Password" />
                      </td>
                      <td className="p-3">
                        <select value={u.clearance_level || 1} onChange={(e) => {
                          const lvl = parseInt(e.target.value);
                          updateUser(u.id, { clearance_level: lvl, rank: ranksByLevel[lvl][0] });
                        }} className="bg-slate-800 border border-slate-700 rounded p-1 text-white">
                          {[1,2,3,4,5].map(l => <option key={l} value={l}>Level {l}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <select value={u.rank || ranksByLevel[u.clearance_level || 1][0]} onChange={(e) => updateUser(u.id, { rank: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white w-full max-w-[150px]">
                          {ranksByLevel[u.clearance_level || 1]?.map(r => <option key={r} value={r}>{r}</option>)}
                          {u.clearance_level === 5 && <option value="Directeur">Directeur</option>}
                        </select>
                      </td>
                      <td className="p-3 flex flex-col gap-1">
                        <select value={u.department || "Département de la Sécurité"} onChange={(e) => updateUser(u.id, { department: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white">
                          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                        <select value={u.mtf_unit_id || ""} onChange={(e) => updateUser(u.id, { mtf_unit_id: e.target.value, is_mtf: !!e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs">
                          <option value="">-- No MTF --</option>
                          {mtfUnits.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <select value={u.status || 'ACTIVE'} onChange={(e) => updateUser(u.id, { status: e.target.value })} className={`bg-slate-800 border border-slate-700 rounded p-1 font-bold mb-1 ${u.status === 'K.I.A' ? 'text-red-500' : 'text-green-500'}`}>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="K.I.A">K.I.A</option>
                        </select>
                        <button onClick={() => { if(window.confirm('Supprimer ce compte définitivement?')) base44.entities.AgentAccount.delete(u.id); }} className="block w-full text-center text-xs bg-red-900/50 hover:bg-red-800 text-white rounded p-1 mt-1">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-slate-900/50 border border-slate-800 p-4 rounded max-w-3xl">
              <h3 className="font-bold mb-4 text-white">Recruit Personnel</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input value={recruitForm.scp_id} onChange={e=>setRecruitForm({...recruitForm, scp_id: e.target.value})} placeholder="ID (Identifiant)" className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                <input value={recruitForm.password} onChange={e=>setRecruitForm({...recruitForm, password: e.target.value})} placeholder="Mot de passe" className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                <input value={recruitForm.full_name} onChange={e=>setRecruitForm({...recruitForm, full_name: e.target.value})} placeholder="Nom complet" className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                <select value={recruitForm.clearance_level} onChange={e=>{
                    const lvl = parseInt(e.target.value);
                    setRecruitForm({...recruitForm, clearance_level: lvl, rank: ranksByLevel[lvl][0]});
                }} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none">
                  {[1,2,3,4,5].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
                <select value={recruitForm.rank} onChange={e=>setRecruitForm({...recruitForm, rank: e.target.value})} className="bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none">
                  {ranksByLevel[recruitForm.clearance_level]?.map(r => <option key={r} value={r}>{r}</option>)}
                  {recruitForm.clearance_level === 5 && <option value="Directeur">Directeur</option>}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={recruitForm.is_admin} onChange={e=>setRecruitForm({...recruitForm, is_admin: e.target.checked})} />
                  Droits Administrateur
                </label>
              </div>
              <button onClick={async () => {
                if(!recruitForm.scp_id || !recruitForm.password || !recruitForm.full_name) return alert('Remplissez tous les champs requis.');
                await base44.entities.AgentAccount.create(recruitForm);
                setRecruitForm({ scp_id: '', password: '', full_name: '', clearance_level: 1, rank: 'Recrue', is_admin: false });
                alert('Agent ajouté à la base de données.');
              }} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded text-white font-bold transition-colors">CRÉER LE DOSSIER</button>
            </div>
          </div>
        )}
        {tab === 'status' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert /> Site Security Status</h2>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {['Normal', 'Elevated', 'Lockdown', 'Apollyon'].map(level => (
                <button
                  key={level}
                  onClick={() => updateStatus(level)}
                  className={`p-6 border rounded font-bold uppercase tracking-widest transition-all ${
                    siteStatus === level 
                      ? level === 'Apollyon' ? 'bg-red-900 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-slate-700 border-slate-400 text-white' 
                      : 'border-slate-800 hover:border-slate-500 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-lg">{level}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'logs' && (
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity /> System Logs</h2>
            <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs overflow-auto flex-1">
              {logs.map(log => (
                <div key={log.id} className="mb-2 pb-2 border-b border-slate-800/30">
                  <span className="text-slate-500">[{format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss')}]</span>{' '}
                  <span className="text-blue-400 font-bold">[{log.action}]</span>{' '}
                  <span className="text-slate-300">{log.message}</span>{' '}
                  <span className="text-slate-600"></span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'departments' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Building /> Départements</h2>
            <div className="space-y-2 mb-4">
              {departments.map(d => <div key={d.id} className="p-3 bg-slate-900 border border-slate-700 rounded flex justify-between">{d.name} <button onClick={() => base44.entities.Department.delete(d.id)} className="text-red-500 hover:text-red-400 text-xs">Supprimer</button></div>)}
            </div>
            <button onClick={() => {
              const name = prompt('Nom du département:');
              if (name) base44.entities.Department.create({ name });
            }} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-white font-bold transition-colors">Créer Département</button>
          </div>
        )}
        {tab === 'mtf' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Crosshair /> Forces d'Intervention Mobile</h2>
            <div className="space-y-2 mb-4">
              {mtfUnits.map(m => <div key={m.id} className="p-3 bg-slate-900 border border-slate-700 rounded flex justify-between">{m.name} <button onClick={async () => {
                await base44.entities.MTFUnit.delete(m.id);
                const channels = await base44.entities.MTFChannel.filter({ category: m.name });
                for (const c of channels) {
                  await base44.entities.MTFChannel.delete(c.id);
                }
              }} className="text-red-500 hover:text-red-400 text-xs">Supprimer</button></div>)}
            </div>
            <button onClick={async () => {
              const name = prompt('Nom de la F.I.M:');
              if (name) {
                const newMtf = await base44.entities.MTFUnit.create({ name });
                await base44.entities.MTFChannel.create({ name: 'Discussion - ' + name, category: name, min_clearance: 1, mtf_unit_id: name });
                await base44.entities.MTFChannel.create({ name: 'Rapport - ' + name, category: name, min_clearance: 1, mtf_unit_id: name });
              }
            }} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-white font-bold transition-colors">Créer Unité F.I.M</button>
          </div>
        )}
      </div>
    </div>
  );
}