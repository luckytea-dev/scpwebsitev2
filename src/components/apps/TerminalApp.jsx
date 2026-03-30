import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { TerminalIcon } from 'lucide-react';

const HELP_TEXT = `
SCP FOUNDATION — TERMINAL v2.4
================================
Commandes disponibles :
  help              - Affiche cette aide
  clear             - Efface le terminal
  whoami            - Informations utilisateur
  personnel list    - Liste du personnel
  incidents list    - Liste des incidents
  missions list     - Liste des missions
  system status     - Statut du site
  lockdown          - Déclencher le confinement (L5+)
  logout            - Déconnexion
`.trim();

export default function TerminalApp() {
  const [lines, setLines] = useState([
    { text: 'SCP FOUNDATION — SECURE TERMINAL', type: 'header' },
    { text: 'Tapez "help" pour voir les commandes disponibles.', type: 'info' },
    { text: '', type: 'blank' }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [currentUser, setCurrentUser] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const print = (text, type = 'output') => {
    setLines(prev => [...prev, { text, type }]);
  };

  const handleCommand = async (cmd) => {
    const c = cmd.trim().toLowerCase();
    print(`> ${cmd}`, 'input');

    if (!c) return;

    if (c === 'help') {
      HELP_TEXT.split('\n').forEach(l => print(l, l.startsWith('SCP') ? 'header' : l.startsWith('===') ? 'separator' : 'output'));
    } else if (c === 'clear') {
      setLines([]);
    } else if (c === 'whoami') {
      if (currentUser) {
        print(`Nom: ${currentUser.full_name}`, 'output');
        print(`ID: ${currentUser.scp_id}`, 'output');
        print(`Clearance: LEVEL ${currentUser.clearance_level}`, 'output');
        print(`Rang: ${currentUser.rank}`, 'output');
        print(`Département: ${currentUser.department}`, 'output');
        print(`Statut: ${currentUser.status}`, 'output');
      } else { print('ERREUR: Session non initialisée.', 'error'); }
    } else if (c === 'personnel list') {
      print('Chargement...', 'info');
      const agents = await base44.entities.AgentAccount.list();
      agents.forEach(a => print(`  [L${a.clearance_level}] ${a.full_name} — ${a.scp_id} — ${a.status}`, 'output'));
      print(`Total: ${agents.length} agent(s).`, 'info');
    } else if (c === 'incidents list') {
      print('Chargement...', 'info');
      const incidents = await base44.entities.IncidentReport.list('-created_date', 20);
      incidents.forEach(i => print(`  [${i.severity}] ${i.title} — ${i.status}`, i.severity === 'Critical' ? 'error' : 'output'));
      print(`Total: ${incidents.length} incident(s).`, 'info');
    } else if (c === 'missions list') {
      print('Chargement...', 'info');
      const missions = await base44.entities.Mission.list('-created_date', 20);
      missions.forEach(m => print(`  [${m.status}] ${m.title} — Danger: ${m.danger_level}`, m.status === 'Active' ? 'warn' : 'output'));
      print(`Total: ${missions.length} mission(s).`, 'info');
    } else if (c === 'system status') {
      const status = await base44.entities.SiteStatus.list();
      const lvl = status[0]?.level || 'Normal';
      print(`Statut du site: ${lvl}`, lvl === 'Normal' ? 'success' : lvl === 'Apollyon' ? 'error' : 'warn');
    } else if (c === 'lockdown') {
      if (!currentUser || (currentUser.clearance_level < 5 && !currentUser.is_admin)) {
        print('ACCÈS REFUSÉ. Clearance Level 5 requis.', 'error');
      } else {
        const s = await base44.entities.SiteStatus.list();
        if (s.length > 0) await base44.entities.SiteStatus.update(s[0].id, { level: 'Lockdown' });
        else await base44.entities.SiteStatus.create({ level: 'Lockdown', description: 'Terminal lockdown' });
        print('PROTOCOLE DE CONFINEMENT ACTIVÉ.', 'error');
        print('Toutes les portes sont verrouillées.', 'error');
      }
    } else if (c === 'logout') {
      print('Déconnexion en cours...', 'info');
      setTimeout(() => { localStorage.removeItem('scp_session_id'); window.location.reload(); }, 1000);
    } else {
      print(`Commande inconnue: "${cmd}". Tapez "help".`, 'error');
    }
    print('', 'blank');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setHistory(h => [input, ...h].slice(0, 50));
      setHistIdx(-1);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  const typeClass = { header: 'text-white font-bold', info: 'text-blue-400', output: 'text-green-400', input: 'text-slate-300', error: 'text-red-400', warn: 'text-yellow-400', success: 'text-green-300', separator: 'text-slate-600', blank: 'h-2' };

  return (
    <div className="flex flex-col h-full bg-black font-mono text-green-400" onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center gap-2 p-3 border-b border-green-900/30 bg-black/80">
        <TerminalIcon size={16} className="text-green-500" />
        <span className="text-green-500 font-bold text-sm tracking-widest">SCP TERMINAL — {currentUser?.scp_id || 'GUEST'}</span>
        <span className="ml-auto text-xs text-green-800">CONNEXION SÉCURISÉE AES-256</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-0.5">
        {lines.map((line, i) => (
          <div key={i} className={`text-sm leading-relaxed ${typeClass[line.type] || 'text-green-400'}`}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 p-4 border-t border-green-900/30 bg-black">
        <span className="text-green-600 text-sm">{currentUser?.scp_id || 'guest'}@scp-os:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          className="flex-1 bg-transparent text-green-400 outline-none text-sm caret-green-400"
          spellCheck={false}
        />
      </div>
    </div>
  );
}