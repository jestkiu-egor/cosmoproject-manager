import { useState, useEffect } from 'react';
import { 
  Key as KeyIcon, 
  Plus, 
  Trash2, 
  Copy, 
  Search,
  ChevronRight,
  Database,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react';
import { Project, ApiKey } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/db';

interface ApiTabProps {
  project: Project;
  onUpdateApiKeys: (projectId: string, keys: ApiKey[]) => void;
}

export const ApiTab = ({ project, onUpdateApiKeys }: ApiTabProps) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newKey, setNewKey] = useState({
    name: '2code.MailAi',
    key: '',
    usageLocation: ''
  });

  const categories = ['2code.MailAi', '2code.MailAssistant', '2code.TranslateAI'];

  useEffect(() => {
    async function loadKeys() {
      const data = await db.fetchApiKeys(project.id);
      setKeys(data);
    }
    loadKeys();
  }, [project.id]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.key) return;

    const created = await db.addApiKey(project.id, {
      name: newKey.name,
      key: newKey.key,
      usageLocation: newKey.usageLocation
    });

    if (created) {
      const updatedKeys = await db.fetchApiKeys(project.id);
      setKeys(updatedKeys);
      onUpdateApiKeys(project.id, updatedKeys);
      setIsModalOpen(false);
      setNewKey({ ...newKey, key: '', usageLocation: '' });
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm('Удалить этот API ключ?')) {
      await db.deleteApiKey(id);
      const updatedKeys = keys.filter(k => k.id !== id);
      setKeys(updatedKeys);
      onUpdateApiKeys(project.id, updatedKeys);
    }
  };

  const handleBulkImport = async () => {
    if (!seedInput.trim()) return;
    const lines = seedInput.split('\n').filter(l => l.trim());
    alert(`Начинаю импорт ${lines.length} ключей...`);
    
    for (const line of lines) {
      await db.addApiKey(project.id, { 
        name: newKey.name, 
        key: line.trim(), 
        usageLocation: 'Bulk imported' 
      });
    }
    
    const updated = await db.fetchApiKeys(project.id);
    setKeys(updated);
    onUpdateApiKeys(project.id, updated);
    setIsSeedModalOpen(false);
    setSeedInput('');
    alert('✅ Импорт завершен!');
  };

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.usageLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по модулю или ключу..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 backdrop-blur-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSeedModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all"
          >
            <Database size={18} />
            <span>Массовый импорт</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            <span>Добавить Ключ</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map(cat => {
          const catKeys = filteredKeys.filter(k => k.name === cat);
          if (catKeys.length === 0 && !searchTerm) return null;
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-2">
                <ChevronRight size={14} className="text-indigo-500" />
                {cat} ({catKeys.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {catKeys.map((k) => (
                  <div key={k.id} className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl backdrop-blur-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                        <KeyIcon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-mono text-sm truncate max-w-[400px]">{k.key}</span>
                          <button 
                            onClick={() => handleCopy(k.key, k.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              copiedId === k.id ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {copiedId === k.id ? <ShieldCheck size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                          Место: <span className="text-slate-400">{k.usageLocation || 'Не указано'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredKeys.filter(k => !categories.includes(k.name)).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-2">Прочие ключи</h3>
            {filteredKeys.filter(k => !categories.includes(k.name)).map(k => (
              <div key={k.id} className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl backdrop-blur-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400">
                    <KeyIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{k.name}</h4>
                    <span className="text-slate-500 font-mono text-xs">{k.key.substring(0, 20)}...</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteKey(k.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        )}

        {keys.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-white/5 rounded-3xl">
            <KeyIcon size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Ключи пока не добавлены</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Новый API Ключ</h2>
              <form onSubmit={handleAddKey} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Модуль / Категория</label>
                  <select value={newKey.name} onChange={e => setNewKey({...newKey, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500">
                    {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    <option value="Other" className="bg-slate-900">Другое</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ключ</label>
                  <input autoFocus type="text" value={newKey.key} onChange={e => setNewKey({...newKey, key: e.target.value})} placeholder="gsk_..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Описание</label>
                  <input type="text" value={newKey.usageLocation} onChange={e => setNewKey({...newKey, usageLocation: e.target.value})} placeholder="Например: Основной сервер" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/40">Сохранить ключ</button>
              </form>
            </motion.div>
          </div>
        )}

        {isSeedModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSeedModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Массовый импорт</h2>
              <p className="text-slate-400 text-xs mb-6">Вставьте список ключей (по одному в строке). Все они будут добавлены в выбранную категорию.</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Категория для импорта</label>
                  <select value={newKey.name} onChange={e => setNewKey({...newKey, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500">
                    {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <textarea 
                  value={seedInput} 
                  onChange={e => setSeedInput(e.target.value)} 
                  placeholder="Вставьте ключи здесь..." 
                  rows={10} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-mono text-xs resize-none"
                />
                <button onClick={handleBulkImport} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/40">Начать импорт</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
