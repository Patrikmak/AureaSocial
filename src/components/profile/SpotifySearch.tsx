"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Music, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface SpotifySearchProps {
  onSelect: (trackName: string) => void;
  initialValue?: string;
}

const SpotifySearch = ({ onSelect, initialValue }: SpotifySearchProps) => {
  const [query, setQuery] = useState(initialValue || '');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchTracks = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;
      setResults(data.tracks || []);
      setShowResults(true);
    } catch (err) {
      console.error('Erro ao buscar no Spotify:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query !== initialValue) {
        searchTracks(query);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchTracks, initialValue]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') setShowResults(false);
          }}
          placeholder="Pesquisar música ou artista..."
          className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500 pl-10"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                const selection = `${track.artist} - ${track.name}`;
                setQuery(selection);
                onSelect(selection);
                setShowResults(false);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
            >
              <img src={track.albumArt} className="w-10 h-10 rounded-md object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{track.name}</p>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
              </div>
              <Music size={14} className="text-violet-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpotifySearch;