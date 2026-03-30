import React from 'react';

export default function LockdownOverlay({ siteStatus }) {
  const active = siteStatus === 'Lockdown' || siteStatus === 'Apollyon';
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none select-none" style={{ fontFamily: 'monospace' }}>
      {/* Black background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />

      {/* Top chevron stripes */}
      <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden flex">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-20" style={{
            background: i % 2 === 0 ? '#fff' : '#000',
            clipPath: 'polygon(0 0, 100% 0, 80% 100%, -20% 100%)'
          }} />
        ))}
      </div>

      {/* Bottom chevron stripes */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden flex">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-20" style={{
            background: i % 2 === 0 ? '#fff' : '#000',
            clipPath: 'polygon(20% 0, 120% 0, 100% 100%, 0% 100%)'
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-10 px-8">
        {/* SCP Logo */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/ec/SCP_Foundation_%28emblem%29.svg"
          alt="SCP"
          className="w-32 h-32 filter invert"
        />

        <div className="text-center tracking-widest uppercase text-sm font-bold text-white opacity-80">
          Secure. Contain. Protect.
        </div>

        {/* Main warning text */}
        <div className="text-center max-w-2xl leading-relaxed text-base font-bold uppercase tracking-widest text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
          PROCEED TO THE NEAREST EVACUATION SHELTER OR OTHER SECURE AREA AND WAIT FOR FURTHER INSTRUCTIONS
        </div>

        <div className="text-xs text-white/50 tracking-widest uppercase animate-pulse">
          {siteStatus === 'Apollyon' ? '— PROTOCOLE APOLLYON ACTIVÉ —' : '— PROTOCOLE DE CONFINEMENT ACTIVÉ —'}
        </div>
      </div>
    </div>
  );
}