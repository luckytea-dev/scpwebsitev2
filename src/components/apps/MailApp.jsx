import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Send, Inbox, PenSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function MailApp() {
  const [tab, setTab] = useState('inbox');
  const [mails, setMails] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMail, setSelectedMail] = useState(null);
  const [composeForm, setComposeForm] = useState({ recipient_email: '', subject: '', body: '' });

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) {
       base44.entities.AgentAccount.list().then(a => {
          const u = a.find(x => x.id === id);
          if (u) {
            setCurrentUser(u);
            loadMails(u.scp_id);
          }
       });
    }
    const unsub = base44.entities.Message.subscribe(() => {
      if (currentUser) loadMails(currentUser.scp_id);
    });
    return () => unsub();
  }, [currentUser?.scp_id]);

  const loadMails = async (scp_id) => {
    if (!scp_id) return;
    const inbox = await base44.entities.Message.filter({ recipient_email: scp_id }, '-created_date', 50);
    const sent = await base44.entities.Message.filter({ sender_id: scp_id }, '-created_date', 50);
    setMails({ inbox, sent });
  };

  const handleSend = async () => {
    await base44.entities.Message.create({ ...composeForm, sender_id: currentUser?.scp_id || 'UNKNOWN' });
    setTab('sent');
    setComposeForm({ recipient_email: '', subject: '', body: '' });
  };

  const markAsRead = async (mail) => {
    setSelectedMail(mail);
    if (!mail.is_read && tab === 'inbox') {
      await base44.entities.Message.update(mail.id, { is_read: true });
    }
  };

  const displayList = tab === 'inbox' ? mails.inbox || [] : mails.sent || [];

  if (tab === 'compose') {
    return (
      <div className="flex h-full text-slate-300">
        <div className="w-56 border-r border-slate-800 p-4 space-y-2 bg-slate-900/50">
          <button onClick={() => setTab('inbox')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded font-medium transition-colors"><Inbox size={18}/> Inbox</button>
          <button onClick={() => setTab('sent')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded font-medium transition-colors"><Send size={18}/> Sent</button>
        </div>
        <div className="flex-1 p-6 flex flex-col space-y-4">
          <h2 className="text-2xl font-bold tracking-widest text-white mb-2">NEW TRANSMISSION</h2>
          <input placeholder="ID du destinataire (Correspondance exacte requise)" value={composeForm.recipient_email} onChange={e => setComposeForm({...composeForm, recipient_email: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none" />
          <input placeholder="Subject" value={composeForm.subject} onChange={e => setComposeForm({...composeForm, subject: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-slate-500 outline-none" />
          <textarea placeholder="Message Body" value={composeForm.body} onChange={e => setComposeForm({...composeForm, body: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded text-white resize-none font-mono text-sm focus:border-slate-500 outline-none" />
          <div className="flex justify-end pt-2">
            <button onClick={handleSend} className="flex items-center gap-2 px-8 py-3 bg-slate-200 text-slate-900 rounded hover:bg-white font-bold tracking-wider transition-colors"><Send size={16}/> TRANSMIT</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full text-slate-300">
      <div className="w-56 border-r border-slate-800 p-4 space-y-2 bg-slate-900/50">
        <button onClick={() => { setTab('compose'); setSelectedMail(null); }} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-200 hover:bg-white text-slate-900 rounded font-bold mb-6 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"><PenSquare size={16}/> NEW MESSAGE</button>
        <button onClick={() => { setTab('inbox'); setSelectedMail(null); }} className={`w-full flex items-center gap-3 p-3 rounded font-medium transition-colors ${tab === 'inbox' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
          <Inbox size={18}/> Inbox
          {mails.inbox?.filter(m => !m.is_read).length > 0 && <span className="ml-auto bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{mails.inbox.filter(m => !m.is_read).length}</span>}
        </button>
        <button onClick={() => { setTab('sent'); setSelectedMail(null); }} className={`w-full flex items-center gap-3 p-3 rounded font-medium transition-colors ${tab === 'sent' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><Send size={18}/> Sent</button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/30">
        {selectedMail ? (
          <div className="p-8 h-full flex flex-col relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Mail size={200} /></div>
            <button onClick={() => setSelectedMail(null)} className="flex items-center gap-2 text-slate-400 hover:text-white w-fit mb-6 transition-colors"><ArrowLeft size={16}/> BACK</button>
            <div className="mb-8 pb-6 border-b border-slate-800 z-10">
              <h2 className="text-3xl font-bold text-white mb-4">{selectedMail.subject}</h2>
              <div className="flex items-center gap-4 text-sm bg-slate-900 p-4 rounded border border-slate-800">
                <div className="flex-1">
                  <div className="text-slate-500 mb-1">FROM (ID): <span className="text-slate-300">{selectedMail.sender_id || selectedMail.created_by}</span></div>
                  <div className="text-slate-500">TO: <span className="text-slate-300">{selectedMail.recipient_email}</span></div>
                </div>
                <div className="text-right text-slate-500 font-mono">
                  {format(new Date(selectedMail.created_date), 'yyyy-MM-dd')}<br/>
                  {format(new Date(selectedMail.created_date), 'HH:mm:ss')}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto whitespace-pre-wrap text-slate-300 font-mono text-sm leading-relaxed p-4 bg-slate-900/30 rounded border border-slate-800/50 z-10">
              {selectedMail.body}
            </div>
          </div>
        ) : (
          <div className="overflow-auto p-6 space-y-3">
            <h2 className="text-2xl font-bold mb-6 tracking-widest text-white uppercase border-b border-slate-800 pb-4">{tab} DIRECTORY</h2>
            {displayList.map(mail => (
              <button 
                key={mail.id} 
                onClick={() => markAsRead(mail)}
                className={`w-full text-left p-4 rounded border transition-colors flex justify-between items-center group ${mail.is_read || tab === 'sent' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600' : 'bg-slate-800 border-slate-500 text-slate-200 hover:bg-slate-700'}`}
              >
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (!mail.is_read && tab === 'inbox') ? '#3b82f6' : 'transparent' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-lg truncate mb-1 ${!mail.is_read && tab === 'inbox' ? 'font-bold text-white' : 'font-medium'}`}>{mail.subject}</div>
                    <div className="text-sm font-mono truncate opacity-70">{tab === 'inbox' ? `FR: ${mail.sender_id || 'INCONNU'}` : `TO: ${mail.recipient_email}`}</div>
                  </div>
                </div>
                <div className="text-sm font-mono opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-4">
                  {format(new Date(mail.created_date), 'MMM dd, HH:mm')}
                </div>
              </button>
            ))}
            {displayList.length === 0 && <div className="text-slate-500 font-mono text-center py-12 border border-dashed border-slate-800 rounded">DIRECTORY EMPTY.</div>}
          </div>
        )}
      </div>
    </div>
  );
}