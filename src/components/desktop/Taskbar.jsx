import React, { useState, useEffect } from 'react';
import { Shield, Database, Mail, Globe, Radio, AlertTriangle, MessageSquare, Video, Map as MapIcon, Crosshair, Settings as SettingsIcon, Calculator, Search, Users, Car, Clock, UserCheck, Target, TerminalIcon, Rocket } from 'lucide-react';
import { format } from 'date-fns';

const iconMap = { Shield, Database, Mail, Globe, Radio, MessageSquare, Video, MapIcon, Crosshair, SettingsIcon, Calculator, Search, Users, Car, AlertTriangle, Clock, UserCheck, Target, TerminalIcon, Rocket };

export default function Taskbar({ apps, onToggleApp, startMenuOpen, setStartMenuOpen, siteStatus }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-900 border-t border-slate-700 flex items-center px-2 z-[9999] justify-between">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          className={`flex items-center justify-center w-10 h-10 rounded hover:bg-slate-800 transition-colors ${startMenuOpen ? 'bg-slate-800' : ''}`}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/SCP_Foundation_%28emblem%29.svg" alt="Start" className="w-6 h-6 filter invert" />
        </button>

        <div className="h-6 w-px bg-slate-700 mx-2" />

        {apps.filter(app => app.isOpen).map(app => {
          const Icon = iconMap[app.icon];
          return (
            <button
              key={app.id}
              onClick={() => onToggleApp(app.id)}
              className={`flex items-center gap-2 px-3 h-10 rounded border-b-2 transition-colors ${
                !app.isMinimized 
                  ? 'bg-slate-800 border-slate-400 text-white' 
                  : 'hover:bg-slate-800/50 border-transparent text-slate-400'
              }`}
            >
              <Icon size={16} />
              <span className="text-xs font-bold truncate max-w-[120px]">{app.title}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 px-4 h-full bg-slate-800/50 rounded-l-lg border-l border-t border-slate-700">
        {siteStatus !== 'Normal' && (
          <div className="flex items-center gap-2 text-red-500 animate-pulse">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold uppercase">STATUS: {siteStatus}</span>
          </div>
        )}
        <div className="text-right">
          <div className="text-sm font-bold">{format(time, 'HH:mm:ss')}</div>
          <div className="text-xs text-slate-400">{format(time, 'yyyy-MM-dd')}</div>
        </div>
      </div>
    </div>
  );
}