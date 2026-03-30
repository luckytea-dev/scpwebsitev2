import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Map as MapIcon, Plus, AlertTriangle, Shield, X, Trash2 } from 'lucide-react';

const iconColors = {
  SCP: 'red',
  Incident: 'orange',
  MTF: 'blue',
  Forbidden: 'black'
};

const createCustomIcon = (type) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${iconColors[type]}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${iconColors[type]};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

function MapEvents({ onMapClick }) {
  useMapEvents({ click: onMapClick });
  return null;
}

export default function MapApp() {
  const [markers, setMarkers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('scp_session_id');
    if (id) base44.entities.AgentAccount.list().then(a => setCurrentUser(a.find(x => x.id === id)));
    loadMarkers();
    const unsub = base44.entities.MapMarker.subscribe(() => loadMarkers());
    return () => unsub();
  }, []);

  const loadMarkers = async () => {
    const m = await base44.entities.MapMarker.list();
    setMarkers(m);
  };

  const handleMapClick = (e) => {
    if ((currentUser?.clearance_level || 1) < 2) return;
    setForm({ lat: e.latlng.lat, lng: e.latlng.lng, type: 'Incident', notes: '', min_clearance: 1 });
  };

  const saveMarker = async () => {
    await base44.entities.MapMarker.create(form);
    setForm(null);
  };

  const deleteMarker = async (id) => {
    await base44.entities.MapMarker.delete(id);
  };

  const clearance = currentUser?.clearance_level || 1;
  const visibleMarkers = markers.filter(m => clearance >= m.min_clearance);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative text-slate-300">
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 p-3 rounded border border-slate-700 shadow-2xl backdrop-blur-sm w-64">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><MapIcon size={16}/> SATELLITE UPLINK</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> SCP Entities</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Incidents</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> MTF Units</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-black border border-white"></div> Forbidden Zones</div>
        </div>
        <div className="mt-3 text-[10px] text-slate-500 italic">Click on map to add marker (L2+ required).</div>
      </div>

      {form && (
        <div className="absolute top-4 right-4 z-[400] bg-slate-900 p-4 rounded border border-slate-700 shadow-2xl w-72">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white">New Marker</h3>
            <button onClick={() => setForm(null)} className="text-slate-400 hover:text-white"><X size={16}/></button>
          </div>
          <div className="space-y-3">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white">
              <option value="Incident">Incident</option>
              <option value="SCP">SCP Entity</option>
              <option value="MTF">MTF Unit</option>
              <option value="Forbidden">Forbidden Zone</option>
            </select>
            <input placeholder="Notes / Description" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white" />
            <select value={form.min_clearance} onChange={e => setForm({...form, min_clearance: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white">
              {[1,2,3,4,5].map(l => <option key={l} value={l}>Clearance Level {l}</option>)}
            </select>
            <button onClick={saveMarker} className="w-full bg-slate-200 text-black py-2 rounded font-bold hover:bg-white">DEPLOY</button>
          </div>
        </div>
      )}

      <div className="flex-1 z-0">
        <MapContainer center={[0, 0]} zoom={3} className="w-full h-full" zoomControl={false} attributionControl={false}>
          <ImageOverlay
            url="https://wallpaperaccess.com/full/3428513.jpg"
            bounds={[[-90, -180], [90, 180]]}
          />
          <MapEvents onMapClick={handleMapClick} />
          {visibleMarkers.map(m => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={createCustomIcon(m.type)}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[150px]">
                  <div className="font-bold text-black border-b border-gray-300 pb-1 mb-1 flex justify-between">
                    {m.type}
                    {clearance >= 3 && <button onClick={() => deleteMarker(m.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>}
                  </div>
                  <div className="text-sm text-gray-700">{m.notes || 'No data.'}</div>
                  <div className="text-[10px] text-gray-400 mt-2 font-mono">CLR-LVL: {m.min_clearance}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}