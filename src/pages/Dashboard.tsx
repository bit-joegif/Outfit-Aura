import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ClothingItem, Outfit, WeatherData } from '../types';
import { Cloud, Sun, Thermometer, Shirt, Sparkles, Calendar, ChevronRight, Loader2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Dashboard() {
  const [itemsCount, setItemsCount] = useState(0);
  const [outfitsCount, setOutfitsCount] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [suggestion, setSuggestion] = useState<Outfit | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedItems, setSuggestedItems] = useState<ClothingItem[]>([]);
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [suggestionType, setSuggestionType] = useState<'Outfit' | 'Auto-Match' | null>(null);

  const occasions = ['Casual', 'Formal', 'Party', 'Work', 'Sport'];

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const itemsSnap = await getDocs(query(collection(db, 'clothingItems'), where('ownerId', '==', user.uid)));
        const fetchedItems = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem));
        setItemsCount(itemsSnap.size);
        setItems(fetchedItems);

        const outfitsSnap = await getDocs(query(collection(db, 'outfits'), where('ownerId', '==', user.uid)));
        setOutfitsCount(outfitsSnap.size);

        const calendarSnap = await getDocs(query(collection(db, 'calendar'), where('ownerId', '==', user.uid)));
        setPlannedCount(calendarSnap.size);

        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const res = await axios.get(`/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            setWeather({ temp: Math.round(res.data.main.temp), condition: res.data.weather[0].main, city: res.data.name });
          } catch (err) { console.error(err); }
        }, async () => {
          try {
            const res = await axios.get('/api/weather?city=London');
            setWeather({ temp: Math.round(res.data.main.temp), condition: res.data.weather[0].main, city: res.data.name });
          } catch (err) { console.error(err); }
        });
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (weather && items.length > 0) {
      const generateSuggestion = () => {
        const user = auth.currentUser;
        if (!user) return;

        let targetSeason: string = 'Spring';
        if (weather.temp > 25) targetSeason = 'Summer';
        else if (weather.temp < 10) targetSeason = 'Winter';
        else if (weather.temp < 18) targetSeason = 'Autumn';

        // Filter items matching season and occasion
        const matchingItems = items.filter(it => 
          (it.season === targetSeason || it.season === 'All') &&
          (!selectedOccasion || it.occasion === selectedOccasion)
        );

        // Try to construct an outfit from pieces (Top + Bottom + Shoes)
        const tops = matchingItems.filter(it => it.category === 'Top');
        const bottoms = matchingItems.filter(it => it.category === 'Bottom');
        const shoes = matchingItems.filter(it => it.category === 'Shoes');

        if (tops.length > 0 || bottoms.length > 0 || shoes.length > 0) {
          const top = tops[Math.floor(Math.random() * tops.length)];
          const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
          const shoe = shoes[Math.floor(Math.random() * shoes.length)];

          setSuggestedItems([top, bottom, shoe].filter(Boolean) as ClothingItem[]);
          setSuggestionType('Auto-Match');
        } else {
          setSuggestedItems([]);
          setSuggestionType(null);
        }
      };
      generateSuggestion();
    }
  }, [weather, items, shuffleTrigger, selectedOccasion]);

  if (loading) return (

    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-accent opacity-20" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 -m-8 md:-m-12 lg:-m-16 min-h-[calc(100vh-5rem)]">
      {/* Left Column: Studio Stats */}
      <section className="lg:col-span-3 border-r border-brand-border p-10 flex flex-col">
        <h2 className="text-4xl font-serif italic mb-12">Your Studio</h2>
        <div className="space-y-10 flex-1">
          <StatBlock label="Inventory" value={`${itemsCount} Items`} />
          <StatBlock label="Curated Sets" value={`${outfitsCount} Outfits`} />
          <StatBlock label="Daily Plan" value={`${plannedCount} Active`} />
        </div>
        
        <div className="mt-auto hidden lg:block">
           <h4 className="art-label mb-6 border-b border-brand-border pb-2">Recently Added</h4>
           <div className="grid grid-cols-2 gap-3">
             {items.slice(0, 4).map(item => (
               <div key={item.id} className="aspect-square bg-brand-muted/20 rounded-sm overflow-hidden border border-brand-border">
                 <img src={item.imageUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all cursor-pointer" alt="" />
               </div>
             ))}
             {Array(Math.max(0, 4 - items.slice(0,4).length)).fill(0).map((_, i) => (
               <div key={i} className="aspect-square bg-brand-muted/10 rounded-sm border border-brand-border" />
             ))}
           </div>
        </div>
      </section>

      {/* Middle: Hero Recommendation */}
      <section className="lg:col-span-6 p-10 bg-white border-r border-brand-border">
        {/* Occasion Selector */}
        <div className="mb-8 p-1 bg-brand-paper rounded-full border border-brand-border flex overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setSelectedOccasion('')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all",
              selectedOccasion === '' ? "bg-brand-text text-white shadow-md" : "text-brand-text/40 hover:text-brand-text"
            )}
          >
            Daily Aura
          </button>
          {occasions.map(occ => (
            <button 
              key={occ}
              onClick={() => setSelectedOccasion(occ)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all",
                selectedOccasion === occ ? "bg-brand-text text-white shadow-md" : "text-brand-text/40 hover:text-brand-text"
              )}
            >
              {occ}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-brand-text text-white">
                {suggestionType === 'Outfit' ? 'Recommended Set' : 'Rule-Based Match'}
              </span>
            </div>
            <h3 className="text-5xl font-serif leading-tight">
              {suggestion?.name || "Daily Aura"}
            </h3>
          </div>
          {weather && (
            <div className="text-right">
              <p className="text-3xl font-serif">{weather.temp}°</p>
              <p className="art-label opacity-50">{weather.condition} / {weather.city}</p>
            </div>
          )}
        </div>

        <div className="relative h-[440px] bg-brand-paper rounded-2xl flex items-center justify-center overflow-hidden border border-brand-border">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
           
           {suggestedItems.length > 0 ? (
             <div className="z-10 flex gap-4 md:gap-8 items-center justify-center">
                {suggestedItems.map((item, i) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 30, rotate: i === 0 ? -4 : i === 1 ? 2 : 6 }}
                    animate={{ 
                      opacity: 1, 
                      y: i === 1 ? 40 : 0, 
                      rotate: i === 0 ? -4 : i === 1 ? 2 : 6 
                    }}
                    transition={{ delay: i * 0.1 }}
                    className="w-32 h-48 md:w-40 md:h-60 shadow-2xl rounded-sm border-[6px] border-white overflow-hidden bg-white shrink-0 group/item"
                  >
                    <img src={item.imageUrl} className="w-full h-full object-cover grayscale transition-all group-hover/item:grayscale-0" alt="" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/90 text-[8px] font-black uppercase tracking-tighter text-brand-text border border-brand-border">
                      {item.category}
                    </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="text-center p-12 max-w-sm space-y-4 opacity-30 font-serif">
                <Shirt className="w-12 h-12 mx-auto" />
                <p className="text-xl">Your studio awaits content to begin the curation process.</p>
             </div>
           )}

           <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-lg border border-brand-border flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-tighter font-bold opacity-30 flex items-center gap-1">
                Coordination Logic
              </p>
              <p className="text-xs font-serif italic leading-relaxed text-brand-text">
                {suggestedItems.length > 0 ? "Items matched based on current weather variables and selected occasion." : "Upload pieces to enable coordination logic."}
              </p>
           </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link to="/wardrobe" className="flex-1">
            <button className="art-button-primary w-full shadow-lg">
              Curate More
            </button>
          </Link>
          <button 
            onClick={() => setShuffleTrigger(s => s + 1)} 
            className="art-button-secondary flex-1"
          >
             Shuffle Aura
          </button>
        </div>
      </section>


      {/* Right Column: Mini Calendar / Quick Update */}
      <section className="lg:col-span-3 p-10 flex flex-col bg-brand-paper/30">
        <div className="mb-12">
          <h4 className="art-label mb-6 border-b border-brand-border pb-2">Digital Curator</h4>
          <div className="p-6 bg-[#EFEEE8] rounded-[40px] border border-brand-border/50">
            <p className="text-[11px] leading-relaxed italic text-brand-accent">
              "Style isn't just what you wear, it's how you represent your intent to the world."
            </p>
            <p className="text-[9px] mt-2 uppercase tracking-widest opacity-60">— Aura Editorial</p>
          </div>
        </div>

        <div className="mb-12 flex-1">
           <h4 className="art-label mb-6 border-b border-brand-border pb-2">Presence Log</h4>
           <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 opacity-30">
                  <span className="text-lg font-serif italic">{['Mon', 'Tue', 'Wed'][i]}</span>
                  <div className="flex-1 h-px bg-brand-text opacity-10"></div>
                  <span className="text-[9px] uppercase font-bold tracking-widest">Awaiting Plan</span>
                </div>
              ))}
           </div>
        </div>

        <Link to="/wardrobe">
          <button className="w-full py-10 bg-brand-accent text-white flex flex-col items-center justify-center gap-4 rounded-sm hover:bg-brand-text transition-all group overflow-hidden relative shadow-xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform relative z-10" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black relative z-10">Update Wardrobe</span>
          </button>
        </Link>
      </section>
    </div>
  );
}

function StatBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="group">
      <p className="art-label mb-1 opacity-50">{label}</p>
      <p className="text-3xl font-serif group-hover:italic transition-all">{value}</p>
    </div>
  );
}
