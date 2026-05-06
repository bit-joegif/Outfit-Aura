import { useEffect, useState, FormEvent } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Outfit, ClothingItem, Occasion, Season } from '../types';
import { Plus, Trash2, Sparkles, X, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Outfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const outfitsSnap = await getDocs(query(collection(db, 'outfits'), where('ownerId', '==', user.uid)));
      setOutfits(outfitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit)));

      const itemsSnap = await getDocs(query(collection(db, 'clothingItems'), where('ownerId', '==', user.uid)));
      setItems(itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await deleteDoc(doc(db, 'outfits', id));
    setOutfits(outfits.filter(o => o.id !== id));
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-brand-border">
        <div>
          <h1 className="text-4xl font-serif text-brand-text mb-2 italic">Curated Sets</h1>
          <p className="art-label opacity-60">High-intent style combinations.</p>
        </div>
        
        <button
          onClick={() => setIsAddOpen(true)}
          className="art-button-primary shadow-sm"
        >
          <Sparkles className="w-4 h-4 inline-block mr-2" /> Create Outfit
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent opacity-20" />
        </div>
      ) : outfits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {outfits.map((outfit) => (
            <motion.div
              layout
              key={outfit.id}
              className="group relative"
            >
              <div className="aspect-[4/5] relative bg-brand-paper border border-brand-border p-6 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-serif italic text-brand-text max-w-[70%] leading-tight">{outfit.name}</h3>
                  <button onClick={() => handleDelete(outfit.id)} className="p-2 text-brand-accent opacity-30 hover:opacity-100 hover:text-red-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center relative my-4">
                   {outfit.itemIds.slice(0, 3).map((itemId, idx) => {
                     const item = items.find(it => it.id === itemId);
                     return item && (
                       <motion.div
                         key={itemId}
                         initial={{ rotate: idx === 0 ? -5 : idx === 1 ? 5 : 0 }}
                         className={cn(
                            "absolute w-32 h-44 border-4 border-white shadow-xl overflow-hidden bg-white",
                            idx === 1 && "z-10 translate-x-4 translate-y-4",
                            idx === 2 && "-translate-x-8 -translate-y-4"
                         )}
                       >
                         <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                       </motion.div>
                     );
                   })}
                </div>

                <div className="flex justify-between items-end border-t border-brand-border pt-4">
                  <div className="space-y-1">
                    <p className="art-label opacity-40">{outfit.occasion}</p>
                    <p className="art-label">{outfit.season}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#e5e5e0]">
          <Sparkles className="w-16 h-16 text-[#e5e5e0] mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">No outfits yet</h2>
          <p className="text-[#5A5A40]">Start by combining items from your wardrobe.</p>
        </div>
      )}

      <AnimatePresence>
        {isAddOpen && (
          <AddOutfitModal clothes={items} onClose={() => setIsAddOpen(false)} onAdd={fetchData} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddOutfitModal({ clothes, onClose, onAdd }: { clothes: ClothingItem[], onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState<Occasion>('Casual');
  const [season, setSeason] = useState<Season>('Spring');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || selectedIds.length === 0) return alert('Please add a name and select items');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'outfits'), {
        name,
        itemIds: selectedIds,
        occasion,
        season,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      onAdd();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#f8f8f6] w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-10 border-b border-[#e5e5e0] flex items-center justify-between">
          <h2 className="text-3xl font-serif italic text-[#1a1a1a]">Outfit Builder</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="w-8 h-8 text-[#5A5A40]" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-4 block">Outfit Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-6 rounded-3xl border border-[#e5e5e0] outline-none text-xl font-serif italic bg-white"
                placeholder="e.g. Summer Brunch"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-4 block">Occasion</label>
                <select value={occasion} onChange={e => setOccasion(e.target.value as any)} className="w-full p-5 rounded-2xl border border-[#e5e5e0] outline-none bg-white font-medium">
                  <option>Casual</option><option>Formal</option><option>Party</option><option>Work</option><option>Sport</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-4 block">Season</label>
                <select value={season} onChange={e => setSeason(e.target.value as any)} className="w-full p-5 rounded-2xl border border-[#e5e5e0] outline-none bg-white font-medium">
                  <option>Spring</option><option>Summer</option><option>Autumn</option><option>Winter</option><option>All</option>
                </select>
              </div>
            </div>

            <div className="pt-6">
              <p className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-4 block">Selected Items ({selectedIds.length})</p>
              <div className="flex flex-wrap gap-3">
                {selectedIds.map(id => {
                  const item = clothes.find(c => c.id === id);
                  return item ? (
                    <motion.div layout id={`selected-${id}`} key={id} className="relative group w-16 h-20 rounded-xl overflow-hidden border border-[#5A5A40]">
                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                      <button onClick={() => toggleItem(id)} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xs uppercase tracking-widest font-bold text-[#5A5A40]">Pick from Wardrobe</p>
            <div className="grid grid-cols-3 gap-4 pb-10">
              {clothes.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all border-4",
                    selectedIds.includes(item.id) ? "border-[#FF6321] scale-95 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                >
                  <img src={item.imageUrl} className="w-full h-full object-cover" />
                  {selectedIds.includes(item.id) && (
                    <div className="absolute top-2 right-2 p-1 bg-[#FF6321] text-white rounded-full">
                      <Plus className="w-4 h-4 rotate-45" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-[#e5e5e0] bg-white">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-bold text-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Outfit"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
