import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Video, Maximize, Pause, Play, FastForward, AlertTriangle, Plus, Trash2, Edit } from 'lucide-react';

export default function CctvApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCam, setActiveCam] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadCameras();
    const unsub = base44.entities.Camera.subscribe(() => loadCameras());
    return () => unsub();
  }, []);

  const loadCameras = async () => {
    const cams = await base44.entities.Camera.list();
    if (cams.length === 0) {
        await base44.entities.Camera.create({ name: 'Site-██ – Corridor A', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', min_clearance: 1, status: 'ONLINE' });
        await base44.entities.Camera.create({ name: 'Containment Zone 173', type: 'noise', min_clearance: 2, status: 'OFFLINE', note: 'CAMERA FEED LOST' });
    } else {
        setCameras(cams);
        setActiveCam(prev => prev || cams[0]);
    }
  };

  const handleSave = async () => {
    if (editForm.id) {
      await base44.entities.Camera.update(editForm.id, editForm);
    } else {
      await base44.entities.Camera.create(editForm);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Camera.delete(id);
    if (activeCam?.id === id) setActiveCam(cameras[0] || null);
  };

  const clearance = currentUser?.clearance_level || 1;
  const isLevel5 = clearance >= 5 || currentUser?.role === 'admin';

  return (
    <div className="flex h-full bg-black text-slate-300">
      <div className="w-64 border-r border-slate-800 bg-slate-900/80 p-2 overflow-auto flex flex-col">
        <div className="font-bold p-2 text-white mb-2 border-b border-slate-800 flex justify-between items-center">
            <span className="flex items-center gap-2"><Video size={16}/> CCTV</span>
            {isLevel5 && <button onClick={() => { setEditForm({ type: 'video', status: 'ONLINE', min_clearance: 1 }); setIsEditing(true); }} className="hover:text-blue-400"><Plus size={16}/></button>}
        </div>
        <div className="flex-1 overflow-auto">
        {cameras.map(cam => {
          const authorized = clearance >= cam.min_clearance;
          return (
            <div key={cam.id} className="relative group">
              <button
                onClick={() => authorized && setActiveCam(cam)}
                className={`w-full text-left p-3 mb-1 rounded border transition-colors ${
                  activeCam?.id === cam.id ? 'bg-slate-800 border-slate-500' : 'bg-transparent border-transparent hover:bg-slate-800/50'
                } ${!authorized ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-bold text-xs truncate pr-6">
                  {cam.name}
                  {!authorized && <AlertTriangle size={12} className="inline ml-2 text-red-500" />}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-[10px] px-1 rounded ${
                    cam.status === 'ONLINE' ? 'bg-green-900/50 text-green-400' : 
                    cam.status === 'OFFLINE' ? 'bg-slate-800 text-slate-400' : 'bg-red-900/50 text-red-400 animate-pulse'
                  }`}>{cam.status}</span>
                  <span className="text-[9px] text-slate-500">L{cam.min_clearance}</span>
                </div>
              </button>
              {isLevel5 && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => { setEditForm(cam); setIsEditing(true); }} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded"><Edit size={12}/></button>
                    <button onClick={() => handleDelete(cam.id)} className="text-slate-400 hover:text-red-500 bg-slate-800 p-1 rounded"><Trash2 size={12}/></button>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
      <div className="flex-1 flex flex-col relative bg-black p-4">
        {isEditing ? (
            <div className="bg-slate-900 p-6 rounded border border-slate-700 max-w-lg mx-auto w-full mt-10 z-10 relative">
                <h3 className="text-xl font-bold mb-4 text-white">Configure Camera Feed</h3>
                <div className="space-y-4 text-sm">
                    <input placeholder="Camera Name" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                    <select value={editForm.type || 'video'} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none">
                        <option value="video">Live Video Stream</option>
                        <option value="noise">Static / Noise</option>
                    </select>
                    {editForm.type === 'video' && (
                        <input placeholder="Video URL (mp4)" value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                    )}
                    {editForm.type === 'noise' && (
                        <input placeholder="Error Note" value={editForm.note || ''} onChange={e => setEditForm({...editForm, note: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none" />
                    )}
                    <select value={editForm.status || 'ONLINE'} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none">
                        <option value="ONLINE">ONLINE</option>
                        <option value="OFFLINE">OFFLINE</option>
                        <option value="JAMMED">JAMMED</option>
                    </select>
                    <select value={editForm.min_clearance || 1} onChange={e => setEditForm({...editForm, min_clearance: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white outline-none">
                        {[1,2,3,4,5].map(l => <option key={l} value={l}>Clearance Level {l}</option>)}
                    </select>
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-700 rounded hover:bg-slate-800">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-slate-200 text-black rounded font-bold hover:bg-white">Save</button>
                    </div>
                </div>
            </div>
        ) : activeCam ? (
          <>
            <div className="flex-1 border-2 border-slate-800 rounded relative overflow-hidden bg-slate-900 flex items-center justify-center">
              <div className="absolute top-4 left-4 z-10 font-mono">
                <div className="bg-black/50 px-2 py-1 text-white text-sm border border-slate-700/50 backdrop-blur-sm mb-1">{activeCam.name}</div>
                {activeCam.status === 'ONLINE' && (
                    <div className="bg-black/50 px-2 py-1 text-red-500 text-xs border border-red-900/50 backdrop-blur-sm animate-pulse w-fit flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div> REC
                    </div>
                )}
              </div>

              {activeCam.type === 'video' ? (
                (activeCam.url.includes('youtube.com') || activeCam.url.includes('youtu.be')) ? (
                  <iframe 
                    src={activeCam.url.includes('youtube.com/embed') ? activeCam.url : `https://www.youtube.com/embed/${activeCam.url.split('v=')[1] || activeCam.url.split('/').pop()}?autoplay=1&mute=1`}
                    className="w-full h-full object-cover filter grayscale contrast-125 sepia opacity-80"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    onError={(e) => console.log('Iframe error', e)}
                  />
                ) : activeCam.url.includes('twitch.tv') ? (
                  <iframe 
                    src={`https://player.twitch.tv/?channel=${activeCam.url.split('/').pop()}&parent=${window.location.hostname}&muted=true`}
                    className="w-full h-full object-cover filter grayscale contrast-125 sepia opacity-80"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    key={activeCam.url}
                    src={activeCam.url} 
                    autoPlay={playing} 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover filter grayscale contrast-125 sepia opacity-80"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 font-mono">
                  <div className="w-full h-full absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)', backgroundSize: '100% 4px' }}></div>
                  <AlertTriangle size={48} className="mb-4 text-red-900 animate-pulse" />
                  <div className="text-2xl font-bold tracking-widest text-red-800">{activeCam.note || 'SIGNAL LOST'}</div>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none scanlines opacity-30"></div>
            </div>

            <div className="h-16 mt-4 bg-slate-900 border border-slate-800 rounded flex items-center justify-center gap-6">
              <button onClick={() => setPlaying(!playing)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
                <FastForward size={20} />
              </button>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors ml-8">
                <Maximize size={20} />
              </button>
            </div>
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 font-mono relative z-10">SELECT A CAMERA FEED</div>
        )}
      </div>
    </div>
  );
}