export type Category = 'Top' | 'Bottom' | 'Shoes' | 'Outerwear' | 'Accessory';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All';
export type Occasion = 'Casual' | 'Formal' | 'Party' | 'Work' | 'Sport';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  subCategory?: string;
  color: string;
  season: Season;
  occasion: Occasion;
  imageUrl: string;
  ownerId: string;
  createdAt: any;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  occasion: Occasion;
  season: Season;
  ownerId: string;
  createdAt: any;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId: string;
  ownerId: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
}
