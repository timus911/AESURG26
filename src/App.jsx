
import React, { useState, useMemo } from 'react';
import { Search, Menu, Stethoscope, ChevronRight } from 'lucide-react';
import NoteCard from './components/NoteCard';
import notesData from './data/notes.json';

const CATEGORIES = [
  'All',
  'Face',
  'Breast',
  'Rhinoplasty',
  'Eyes',
  'Body',
  'Genital',
  'Injectables',
  'Other'
];

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter Logic
  const filteredNotes = useMemo(() => {
    return notesData.filter(note => {
      const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
      const searchLower = searchQuery.toLowerCase();

      if (!searchQuery) return matchesCategory;

      const matchesSearch =
        note.title?.toLowerCase().includes(searchLower) ||
        note.content?.toLowerCase().includes(searchLower) ||
        note.speaker?.toLowerCase().includes(searchLower) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        note.blocks?.some(block =>
          block.content?.toLowerCase().includes(searchLower) ||
          block.caption?.toLowerCase().includes(searchLower)
        );

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row">

      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <div className="bg-blue-600 text-white p-1 rounded">
            <Stethoscope size={20} />
          </div>
          Aesurge Notes
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:flex items-center gap-3 font-bold text-xl text-slate-800">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Stethoscope size={24} />
          </div>
          Aesurge
        </div>

        <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Categories
          </div>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setIsSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${selectedCategory === category
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {category}
              {selectedCategory === category && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="max-w-3xl mx-auto p-4 md:p-8">

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search notes, surgeons, techniques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border-none rounded-xl bg-white shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              {selectedCategory} Notes
            </h2>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">
              {filteredNotes.length} items
            </span>
          </div>

          {/* Notes List */}
          <div className="space-y-6">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No notes found for this category.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
