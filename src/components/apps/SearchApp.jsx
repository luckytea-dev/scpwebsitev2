import React, { useState } from 'react';
import { Search as SearchIcon, AlertTriangle } from 'lucide-react';

export default function SearchApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setResults(['ACCESS DENIED: Insufficient clearance for general query.', 'PLEASE CONTACT SYSTEM ADMINISTRATOR.']);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-green-500 font-mono p-6">
      <div className="flex items-center gap-3 mb-8 border-b border-green-900 pb-4">
        <SearchIcon size={24} />
        <h2 className="text-2xl font-bold tracking-widest">FOUNDATION SEARCH INDEX</h2>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Enter search parameters..." 
          className="flex-1 bg-black border border-green-800 p-3 text-green-500 outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all"
        />
        <button type="submit" className="bg-green-900/30 border border-green-800 hover:bg-green-800/50 px-8 py-3 font-bold transition-colors">
          QUERY
        </button>
      </form>

      <div className="flex-1 overflow-auto border border-green-900/50 bg-black/50 p-4">
        {searching ? (
          <div className="flex items-center gap-2 animate-pulse text-green-600">
            <div className="w-2 h-4 bg-green-500 animate-bounce"></div>
            Searching database...
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 text-red-500">
                <AlertTriangle size={16} className="mt-1 flex-shrink-0" />
                <span>{r}</span>
              </div>
            ))}
            {results.length === 0 && <div className="text-green-800 opacity-50">Awaiting input...</div>}
          </div>
        )}
      </div>
    </div>
  );
}