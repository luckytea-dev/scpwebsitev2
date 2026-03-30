import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Rocket, Plus, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  Pending: { color: 'text-yellow-400 border-yellow-800 bg-yellow-900/20', icon: Clock },
  Approved: { color: 'text-green-400 border-green-800 bg-green-900/20', icon: CheckCircle },
  Denied: { color: 'text-red-400 border-red-800 bg-red-900/20', icon: XCircle }
};

export default function MissileAccessApp() {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ target: '', reason: '', auth_code: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadRequests();
    const unsub = base44.entities.MissileLaunchRequest.subscribe(() => loadRequests());
    return () => unsub();
  }, []);

  const loadRequests = async () => {
    const data = await base44.entities.MissileLaunchRequest.list('-created_date', 50);
    setRequests(data);
  };

  const submitRequest = async () => {
    if (!form.target || !form.reason || !form.auth_code) return alert('Remplissez tous les champs.');
    await base44.entities.MissileLaunchRequest.create({
      ...form,
      requested_by_name: currentUser?.full_name || 'Agent',
      requested_by_id: currentUser?.id,
      status: 'Pending'
    });
    setShowForm(false);
    setForm({ target: '', reason: '', auth_code: '' });
  };

  const updateRequest = async (id, status) => {
    await base44.entities.MissileLaunchRequest.update(id, { status, approved_by: currentUser?.full_name });
    base44.entities.DispatchLog.create({ action: 'MISSILE_ACCESS', message: `Demande de lancement ${status} par ${currentUser?.full_name}` });
  };

  const clearance = currentUser?.clearance_level || 1;
  const canApprove = clearance >= 5 || currentUser?.is_admin;
  const canRequest = clearance >= 4 || currentUser?.is_admin;

  if (clearance < 4 && !currentUser?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-red-500 font-mono p-8 text-center">
        <Lock size={64} className="mb-6 animate-pulse" />
        <div className="text-3xl font-bold tracking-widest mb-4">ACCÈS REFUSÉ</div>
        <div className="text-slate-500 text-sm">CLEARANCE LEVEL 4+ REQUIS<br/>SYSTÈME DE LANCEMENT VERROUILLÉ</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono">
      <div className="flex items-center justify-between p-4 border-b border-red-900/50 bg-black">
        <div>
          <h2 className="font-bold text-white flex items-center gap-2 text-lg"><Rocket size={20} className="text-red-500"/> SYSTÈME DE LANCEMENT</h2>
          <div className="text-xs text-red-600 animate-pulse mt-1">⚠ NIVEAU DE SÉCURITÉ MAXIMUM — TOUTES LES ACTIONS SONT ENREGISTRÉES</div>
        </div>
        {canRequest && <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 border border-red-700 px-3 py-1.5 rounded text-white text-sm font-bold"><Plus size={14}/> DEMANDE DE LANCEMENT</button>}
      </div>

      {showForm && (
        <div className="p-4 border-b border-red-900/30 bg-red-950/20">
          <div className="max-w-lg space-y-3">
            <div className="text-xs text-red-400 font-bold uppercase mb-3">⚠ Nouvelle Demande de Lancement</div>
            <input placeholder="Cible (coordonnées / désignation)" value={form.target} onChange={e => setForm({...form, target: e.target.value})} className="w-full bg-slate-950 border border-red-900 p-2 rounded text-white outline-none text-sm" />
            <textarea placeholder="Justification tactique" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full bg-slate-950 border border-red-900 p-2 rounded text-white outline-none text-sm h-20 resize-none" />
            <input placeholder="Code d'autorisation" type="password" value={form.auth_code} onChange={e => setForm({...form, auth_code: e.target.value})} className="w-full bg-slate-950 border border-red-900 p-2 rounded text-white outline-none text-sm font-mono" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-700 rounded hover:bg-slate-800 text-sm">Annuler</button>
              <button onClick={submitRequest} className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded font-bold text-sm">SOUMETTRE DEMANDE</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {canApprove && requests.filter(r => r.status === 'Pending').length > 0 && (
          <div className="text-xs text-yellow-400 font-bold uppercase mb-2 animate-pulse">
            ⚡ {requests.filter(r => r.status === 'Pending').length} DEMANDE(S) EN ATTENTE D'AUTORISATION
          </div>
        )}
        {requests.map(req => {
          const cfg = statusConfig[req.status];
          const Icon = cfg.icon;
          return (
            <div key={req.id} className={`border rounded p-4 ${cfg.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} />
                    <span className="font-bold text-white">{req.target}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cfg.color}`}>{req.status}</span>
                  </div>
                  <div className="text-xs text-slate-500">Demandé par: <span className="text-slate-300">{req.requested_by_name}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">{format(new Date(req.created_date), 'dd/MM/yyyy HH:mm')}</div>
                </div>
                {canApprove && req.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateRequest(req.id, 'Approved')} className="flex items-center gap-1 bg-green-900/50 hover:bg-green-800 border border-green-700 px-3 py-1.5 rounded text-green-300 text-xs font-bold"><CheckCircle size={12}/> APPROUVER</button>
                    <button onClick={() => updateRequest(req.id, 'Denied')} className="flex items-center gap-1 bg-red-900/50 hover:bg-red-800 border border-red-700 px-3 py-1.5 rounded text-red-300 text-xs font-bold"><XCircle size={12}/> REFUSER</button>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-300 border-t border-slate-700/50 pt-3">
                <span className="text-xs text-slate-500 uppercase block mb-1">Justification:</span>
                {req.reason}
              </div>
              {req.approved_by && <div className="text-xs text-slate-500 mt-2">Traité par: <span className="text-slate-300">{req.approved_by}</span></div>}
            </div>
          );
        })}
        {requests.length === 0 && <div className="text-center text-slate-600 py-16 border border-dashed border-red-900/30 rounded">AUCUNE DEMANDE ENREGISTRÉE</div>}
      </div>
    </div>
  );
}