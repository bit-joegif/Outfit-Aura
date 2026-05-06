import { useEffect, useState, FormEvent } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ClothingItem, Category, Season, Occasion } from '../types';
import { Plus, Filter, Trash2, Camera, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState<Category | 'All'>('All');

  const fetchItems = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'clothingItems'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem));
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await deleteDoc(doc(db, 'clothingItems', id));
    setItems(items.filter(i => i.id !== id));
  };

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#e5e5e0]">
        <div>
          <h1 className="text-4xl font-serif text-brand-text mb-2 italic">Wardrobe Studio</h1>
          <p className="text-brand-accent art-label opacity-60">The core of your personal expression.</p>
        </div>
        
        <button
          onClick={() => setIsAddOpen(true)}
          className="art-button-primary shadow-sm"
        >
          <Plus className="w-4 h-4 inline-block mr-2" /> Upload Item
        </button>
      </header>

      <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide border-b border-brand-border">
        {['All', 'Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={cn(
              "text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap",
              filter === cat 
                ? "text-brand-text border-b-2 border-brand-text -mb-4.5 pb-4" 
                : "text-brand-accent opacity-40 hover:opacity-100"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent opacity-20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
          {filteredItems.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={item.id}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-brand-muted/10 border border-brand-border group-hover:border-brand-text transition-all duration-500">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-text/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-brand-text opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-bold uppercase tracking-widest text-brand-text border border-brand-border">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-start">
                <div>
                  <h3 className="font-serif italic text-lg leading-tight">{item.name}</h3>
                  <p className="art-label opacity-50 mt-1">{item.occasion}</p>
                </div>
                <div 
                  className="w-4 h-4 rounded-full border border-brand-border" 
                  style={{ backgroundColor: item.color }} 
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <AddItemModal onClose={() => setIsAddOpen(false)} onAdd={fetchItems} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddItemModal({ onClose, onAdd }: { onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Top' as Category,
    color: '#000000',
    season: 'Spring' as Season,
    occasion: 'Casual' as Occasion,
    imageUrl: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.name) return alert('Please fill in all fields');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'clothingItems'), {
        ...formData,
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

  // Mock image upload for now (using random unsplash images for demo)
  const handleRandomImage = () => {
    const urls = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
    ];
    setFormData(prev => ({ ...prev, imageUrl: urls[Math.floor(Math.random() * urls.length)] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-[#f5f5f0] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif italic text-[#1a1a1a]">Add to Wardrobe</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
              <X className="w-6 h-6 text-[#5A5A40]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={handleRandomImage}
                className="col-span-2 aspect-video rounded-3xl border-2 border-dashed border-[#5A5A40]/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#5A5A40]/5 transition-all overflow-hidden bg-white"
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-[#5A5A40]" />
                    <span className="text-sm font-bold text-[#5A5A40]">Tap to upload (Simulated)</span>
                  </>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-2 block">Item Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 rounded-2xl border border-[#e5e5e0] focus:ring-2 ring-[#5A5A40] outline-none bg-white"
                  placeholder="e.g. Vintage Denim Jacket"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-2 block">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full p-4 rounded-2xl border border-[#e5e5e0] outline-none bg-white font-medium"
                >
                  <option>Top</option>
                  <option>Bottom</option>
                  <option>Shoes</option>
                  <option>Outerwear</option>
                  <option>Accessory</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-2 block">Season</label>
                <select 
                  value={formData.season}
                  onChange={e => setFormData({...formData, season: e.target.value as Season})}
                  className="w-full p-4 rounded-2xl border border-[#e5e5e0] outline-none bg-white font-medium"
                >
                  <option>Spring</option>
                  <option>Summer</option>
                  <option>Autumn</option>
                  <option>Winter</option>
                  <option>All</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-2 block">Occasion</label>
                <select 
                  value={formData.occasion}
                  onChange={e => setFormData({...formData, occasion: e.target.value as Occasion})}
                  className="w-full p-4 rounded-2xl border border-[#e5e5e0] outline-none bg-white font-medium"
                >
                  <option>Casual</option>
                  <option>Formal</option>
                  <option>Party</option>
                  <option>Work</option>
                  <option>Sport</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-2 block">Color</label>
                <div className="flex gap-4 items-center h-[58px]">
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="w-full h-full p-1 rounded-2xl border border-[#e5e5e0] outline-none bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-3xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save to Wardrobe"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
