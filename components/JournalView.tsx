
import React, { useState, useEffect } from 'react';
import { JournalEntry, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { Book, Search, Plus, Sparkles, Calendar as CalendarIcon, Hash, Save, Trash2, ChevronLeft } from 'lucide-react';
import { analyzeJournalEntry } from '../services/geminiService';

interface JournalViewProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  language?: string;
  t: TranslationDictionary;
}

export const JournalView: React.FC<JournalViewProps> = ({ entries, onSaveEntry, onDeleteEntry, language = 'English', t }) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  
  const filteredEntries = entries
    .filter(e => e.content.toLowerCase().includes(searchQuery.toLowerCase()) || e.tags?.some(tag => tag.includes(searchQuery)))
    .sort((a, b) => b.last_updated - a.last_updated);

  const handleCreateNew = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      content: '',
      last_updated: Date.now()
    };
    setSelectedEntry(newEntry);
    setIsMobileListOpen(false);
  };

  const handleAnalyze = async () => {
    if (!selectedEntry || !selectedEntry.content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeJournalEntry(selectedEntry.content, language);
      const updatedEntry = {
        ...selectedEntry,
        mood: analysis.mood,
        ai_reflection: analysis.reflection,
        tags: analysis.tags
      };
      setSelectedEntry(updatedEntry);
      onSaveEntry(updatedEntry);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (selectedEntry) {
      onSaveEntry({ ...selectedEntry, last_updated: Date.now() });
    }
  };

  const selectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsMobileListOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] pb-16 lg:pb-0">
      
      {/* Sidebar / List - Hidden when editor is open on mobile */}
      <div className={`w-full lg:w-1/3 flex flex-col gap-4 ${!isMobileListOpen ? 'hidden lg:flex' : 'flex'}`}>
        <GlassCard className="p-4 !pb-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search journals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent-500"
            />
          </div>
          
          <button 
            onClick={handleCreateNew}
            className="w-full py-2 bg-accent-500 hover:bg-accent-600 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} /> {t.newEntry || 'New Entry'}
          </button>
        </GlassCard>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredEntries.map(entry => (
            <GlassCard 
              key={entry.id}
              onClick={() => selectEntry(entry)}
              className={`p-4 cursor-pointer transition-all hover:bg-foreground/5 ${selectedEntry?.id === entry.id ? 'border-accent-500 bg-foreground/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-accent-400">{entry.date}</span>
                {entry.mood && (
                  <span className="text-[10px] bg-foreground/10 px-2 py-0.5 rounded-full text-muted">{entry.mood}</span>
                )}
              </div>
              <p className="text-sm text-foreground/80 line-clamp-2">{entry.content || "Empty entry..."}</p>
            </GlassCard>
          ))}
          {filteredEntries.length === 0 && (
            <p className="text-center text-muted text-sm italic mt-8">No matching entries found.</p>
          )}
        </div>
      </div>

      {/* Editor - Hidden when list is open on mobile */}
      <div className={`w-full lg:w-2/3 flex flex-col h-full ${isMobileListOpen ? 'hidden lg:flex' : 'flex'}`}>
        {selectedEntry ? (
          <GlassCard className="flex-1 flex flex-col p-4 md:p-6 animate-in fade-in md:slide-in-from-right-4 duration-300">
            {/* Mobile Back Button & Toolbar */}
            <div className="flex justify-between items-center mb-4 border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMobileListOpen(true)} className="lg:hidden p-1 hover:bg-white/10 rounded-full transition-colors mr-1">
                  <ChevronLeft size={20} className="text-white/70" />
                </button>
                <input 
                  type="date"
                  value={selectedEntry.date}
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, date: e.target.value })}
                  className="bg-transparent text-muted text-sm focus:outline-none focus:text-foreground w-32"
                />
              </div>
              <div className="flex gap-1 md:gap-2">
                <button 
                  onClick={() => { onDeleteEntry(selectedEntry.id); setSelectedEntry(null); setIsMobileListOpen(true); }}
                  className="p-1.5 md:p-2 text-muted hover:text-red-400 transition-colors"
                  title="Delete Entry"
                >
                   <Trash2 size={18} />
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !selectedEntry.content}
                  className="px-2 md:px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white text-[10px] md:text-xs font-medium flex items-center gap-1.5 md:gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                >
                   {isAnalyzing ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
                   Reflect
                </button>
                <button 
                  onClick={handleSave}
                  className="p-1.5 md:p-2 text-accent-400 hover:text-accent-300 transition-colors"
                  title="Save"
                >
                   <Save size={18} />
                </button>
              </div>
            </div>

            {/* AI Insights Panel */}
            {selectedEntry.ai_reflection && (
              <div className="mb-4 p-3 md:p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl">
                 <div className="flex items-center gap-2 mb-2 text-accent-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles size={12} /> AI Insight
                 </div>
                 <p className="text-xs md:text-sm text-foreground/90 leading-relaxed italic">"{selectedEntry.ai_reflection}"</p>
                 {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-3">
                     {selectedEntry.tags.map(tag => (
                       <span key={tag} className="text-[8px] md:text-[10px] bg-foreground/5 border border-foreground/10 px-2 py-0.5 rounded text-muted flex items-center gap-1">
                         <Hash size={8} /> {tag}
                       </span>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {/* Text Area */}
            <textarea 
              value={selectedEntry.content}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, content: e.target.value })}
              placeholder="How are you feeling today? Write your thoughts..."
              className="flex-1 w-full bg-transparent border-none outline-none text-foreground text-base md:text-lg leading-relaxed resize-none placeholder-muted custom-scrollbar"
            />
          </GlassCard>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-8 text-center">
             <Book size={48} className="mb-4 opacity-50" />
             <p className="text-sm">Capture your cognitive journey. Select an entry or start a fresh one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
