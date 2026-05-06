import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CalendarEvent, Outfit } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const eventsSnap = await getDocs(query(collection(db, 'calendar'), where('ownerId', '==', user.uid)));
      setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));

      const outfitsSnap = await getDocs(query(collection(db, 'outfits'), where('ownerId', '==', user.uid)));
      setOutfits(outfitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'calendar', id));
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-10">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-brand-border">
        <div>
          <h1 className="text-4xl font-serif text-brand-text mb-2 italic">Outfit Planner</h1>
          <p className="art-label opacity-60">Architecting your weekly presence.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={handlePrevMonth} className="hover:opacity-60 transition-opacity"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-serif text-2xl italic font-bold min-w-[140px] text-center">{format(currentDate, 'MMMM')}</span>
          <button onClick={handleNextMonth} className="hover:opacity-60 transition-opacity"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent opacity-20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-px bg-brand-border border border-brand-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-brand-paper py-4 text-center art-label opacity-40">{d}</div>
          ))}
          {/* Offset for start of month */}
          {Array(startOfMonth(currentDate).getDay()).fill(null).map((_, i) => (
             <div key={`empty-${i}`} className="bg-brand-paper aspect-square opacity-20" />
          ))}
          {days.map(day => {
            const event = events.find(e => e.date === format(day, 'yyyy-MM-dd'));
            const outfit = event ? outfits.find(o => o.id === event.outfitId) : null;

            return (
              <motion.div
                key={day.toString()}
                whileHover={{ backgroundColor: '#fff' }}
                className={cn(
                  "relative aspect-square p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-brand-paper",
                  isToday(day) && "ring-2 ring-inset ring-brand-text z-10"
                )}
                onClick={() => setSelectedDay(day)}
              >
                <span className={cn(
                  "text-2xl font-serif italic",
                  isToday(day) ? "text-brand-text" : "text-brand-accent opacity-30"
                )}>
                  {format(day, 'd')}
                </span>
                
                {outfit && (
                  <div className="mt-2 text-center">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-brand-text leading-tight max-w-[80%] mx-auto">{outfit.name}</p>
                    <div className="w-1 h-1 bg-brand-text rounded-full mx-auto mt-1" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedDay && (
          <DayModal 
            date={selectedDay} 
            outfits={outfits} 
            existingEvent={events.find(e => e.date === format(selectedDay, 'yyyy-MM-dd'))} 
            onClose={() => setSelectedDay(null)} 
            onUpdate={fetchData}
            onDelete={handleDeleteEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DayModal({ date, outfits, existingEvent, onClose, onUpdate, onDelete }: any) {
  const [loading, setLoading] = useState(false);
  const existingOutfit = existingEvent ? outfits.find((o: any) => o.id === existingEvent.outfitId) : null;

  const handleSelectOutfit = async (outfitId: string) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (existingEvent) {
          // Delete old one first or we could update, but lets delete and re-add for simplicity in this demo
          await deleteDoc(doc(db, 'calendar', existingEvent.id));
      }

      await addDoc(collection(db, 'calendar'), {
        date: format(date, 'yyyy-MM-dd'),
        outfitId,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#f8f8f6] w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-10 border-b border-[#e5e5e0] flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif italic text-[#1a1a1a]">{format(date, 'EEEE')}</h2>
            <p className="text-[#5A5A40] text-sm">{format(date, 'MMMM do, yyyy')}</p>
          </div>
          <button onClick={onClose}><X className="w-8 h-8 text-[#5A5A40]" /></button>
        </div>

        <div className="p-10 max-h-[60vh] overflow-y-auto space-y-8">
          {existingOutfit && (
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#FF6321] mb-1">Currently Planned</p>
                <h3 className="text-xl font-serif italic text-orange-950">{existingOutfit.name}</h3>
              </div>
              <button 
                onClick={() => { onDelete(existingEvent.id); onClose(); }} 
                className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#5A5A40] mb-6">Select an Outfit</p>
            <div className="space-y-4">
              {outfits.map((outfit: any) => (
                <button
                  key={outfit.id}
                  onClick={() => handleSelectOutfit(outfit.id)}
                  className="w-full text-left p-6 rounded-[2rem] bg-white border border-[#e5e5e0] hover:border-[#1a1a1a] hover:shadow-lg transition-all group flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-lg font-serif text-[#1a1a1a]">{outfit.name}</h4>
                    <p className="text-xs text-[#5A5A40]">{outfit.occasion} • {outfit.season}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              {outfits.length === 0 && (
                <p className="text-center py-10 text-[#5A5A40] italic">No outfits created yet.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
