export interface FoodItem {
  id: string;
  name: string;
  photo?: string;
  ingredients?: string;
  calories?: number;
  aiNotes?: string;
}

export interface Entry {
  id?: number;
  mood: number;
  food: string;
  foods?: FoodItem[];
  energy: number;
  symptoms: string[];
  notes: string;
  timestamp: number;
  date: string;
}

export interface Stats {
  avgMood: string;
  avgEnergy: string;
  total: number;
}

export interface Pattern {
  icon: string;
  title: string;
  desc: string;
}
