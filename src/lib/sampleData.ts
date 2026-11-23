import { addDays, todayISO } from './format';
import type { Category, ExpenseInput } from './types';

const TEMPLATES: Record<Category, { items: string[]; min: number; max: number; weight: number }> = {
  Food: {
    items: ['Groceries', 'Lunch with team', 'Coffee', 'Dinner out', 'Bakery', 'Takeout pizza', 'Farmers market'],
    min: 4,
    max: 85,
    weight: 10,
  },
  Transportation: {
    items: ['Fuel', 'Ride share', 'Train ticket', 'Parking', 'Bus pass', 'Car wash'],
    min: 3,
    max: 70,
    weight: 6,
  },
  Entertainment: {
    items: ['Movie tickets', 'Streaming subscription', 'Concert', 'Video game', 'Bowling night'],
    min: 8,
    max: 120,
    weight: 3,
  },
  Shopping: {
    items: ['New sneakers', 'Household supplies', 'Books', 'Phone case', 'Gift for a friend', 'Clothing'],
    min: 12,
    max: 180,
    weight: 4,
  },
  Bills: {
    items: ['Electricity bill', 'Internet', 'Mobile plan', 'Water bill', 'Gym membership', 'Insurance'],
    min: 25,
    max: 160,
    weight: 3,
  },
  Other: {
    items: ['Haircut', 'Charity donation', 'Pharmacy', 'Pet supplies', 'Laundry'],
    min: 5,
    max: 60,
    weight: 2,
  },
};

/** Small seeded PRNG so sample data looks the same every time. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSampleExpenses(count = 60, days = 170): ExpenseInput[] {
  const rand = mulberry32(20241123);
  const weighted = (Object.keys(TEMPLATES) as Category[]).flatMap((c) =>
    Array<Category>(TEMPLATES[c].weight).fill(c),
  );
  const today = todayISO();
  const result: ExpenseInput[] = [];
  for (let i = 0; i < count; i++) {
    const category = weighted[Math.floor(rand() * weighted.length)];
    const t = TEMPLATES[category];
    const amount = Math.round((t.min + rand() * (t.max - t.min)) * 100) / 100;
    result.push({
      category,
      amount,
      description: t.items[Math.floor(rand() * t.items.length)],
      date: addDays(today, -Math.floor(rand() * days)),
    });
  }
  return result;
}
