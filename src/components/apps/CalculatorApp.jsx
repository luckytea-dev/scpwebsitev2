import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');

  const handleInput = (val) => {
    if (display === '0' || display === 'ERROR') setDisplay(val);
    else setDisplay(display + val);
  };

  const calculate = () => {
    try {
      // eslint-disable-next-line
      setDisplay(String(eval(display)));
    } catch (e) {
      setDisplay('ERROR');
    }
  };

  const clear = () => setDisplay('0');

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white font-mono p-4">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <Calculator size={16} />
        <span className="text-sm font-bold tracking-widest">STANDARD COMPUTATION</span>
      </div>
      
      <div className="bg-slate-950 border border-slate-700 p-4 text-right text-3xl font-bold rounded mb-4 overflow-hidden break-all min-h-[64px] flex items-center justify-end shadow-inner">
        {display}
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
          <button 
            key={btn}
            onClick={() => btn === '=' ? calculate() : handleInput(btn)}
            className="bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-bold text-xl transition-colors active:bg-slate-600"
          >
            {btn}
          </button>
        ))}
        <button onClick={clear} className="col-span-4 bg-red-900/50 hover:bg-red-800 rounded border border-red-900 font-bold text-xl py-3 mt-2 transition-colors">
          CLEAR
        </button>
      </div>
    </div>
  );
}