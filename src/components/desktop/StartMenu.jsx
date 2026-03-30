import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Database, Mail, Globe, Radio, LogOut, User as UserIcon, MessageSquare, Video, Map as MapIcon, Crosshair, Settings as SettingsIcon, Calculator, Search, Users, Car, AlertTriangle, Clock, UserCheck, Target, TerminalIcon, Rocket } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const iconMap = { Shield, Database, Mail, Globe, Radio, MessageSquare, Video, MapIcon, Crosshair, SettingsIcon, Calculator, Search, Users, Car, AlertTriangle, Clock, UserCheck, Target, TerminalIcon, Rocket };

export default function StartMenu({ isOpen, apps, onToggleApp }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setUser(a.find(x => x.id === id)));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-14 left-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[9998] overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-slate-700 flex items-center gap-4 bg-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-500">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-white">{user?.full_name || 'GUEST'}</div>
              <div className="text-xs text-slate-400">Level {user?.clearance_level || 1} Clearance</div>
            </div>
          </div>
          <div className="p-2 flex-1">
            <div className="text-xs text-slate-500 font-bold mb-2 px-2 mt-2">SYSTEM APPLICATIONS</div>
            {apps.map(app => {
              const Icon = iconMap[app.icon];
              if (!Icon) return null;
              return (
                <button
                  key={app.id}
                  onClick={() => onToggleApp(app.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded transition-colors"
                >
                  <Icon size={18} />
                  <span className="font-bold tracking-wide">{app.title}</span>
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-slate-700 bg-slate-950">
            <button 
              onClick={() => { localStorage.removeItem('scp_session_id'); window.location.reload(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded transition-colors"
            >
              <LogOut size={18} />
              <span className="font-bold">TERMINATE SESSION</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}