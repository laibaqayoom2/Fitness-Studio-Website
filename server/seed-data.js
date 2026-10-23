// Data seeded into Postgres. Only content that is served by the API lives here;
// the remaining marketing copy is static in client/src/data.js.

// Main grid. `spots` = places still open in that class, out of `capacity`.
export const CLASSES = [
  { id: 1, day: 'Mon', time: '06:30', name: 'Strength Lab', coach: 'Coach Amara', category: 'Strength', spots: 8, capacity: 16 },
  { id: 2, day: 'Mon', time: '18:30', name: 'Swim Skills', coach: 'Coach Lena', category: 'Swim', spots: 6, capacity: 10 },
  { id: 3, day: 'Tue', time: '07:00', name: 'Functional Flow', coach: 'Coach Idris', category: 'Cardio', spots: 10, capacity: 18 },
  { id: 4, day: 'Tue', time: '17:45', name: 'Group Strength', coach: 'Coach Amara', category: 'Strength', spots: 12, capacity: 16 },
  { id: 5, day: 'Wed', time: '12:15', name: 'Mobility Reset', coach: 'Coach Lena', category: 'Mobility', spots: 15, capacity: 24 },
  { id: 6, day: 'Wed', time: '19:00', name: 'Cardio Burn', coach: 'Coach Idris', category: 'Cardio', spots: 14, capacity: 20 },
  { id: 7, day: 'Thu', time: '07:00', name: 'Swim Training', coach: 'Coach Lena', category: 'Swim', spots: 6, capacity: 12 },
  { id: 8, day: 'Thu', time: '18:00', name: 'Functional Flow', coach: 'Coach Idris', category: 'Cardio', spots: 10, capacity: 18 },
  { id: 9, day: 'Fri', time: '06:30', name: 'Group Strength', coach: 'Coach Amara', category: 'Strength', spots: 12, capacity: 16 },
  { id: 10, day: 'Fri', time: '17:30', name: 'Open Floor', coach: 'All coaches', category: 'Strength', spots: 20, capacity: 30 },
  { id: 11, day: 'Sat', time: '09:00', name: 'Long Cardio', coach: 'Coach Idris', category: 'Cardio', spots: 16, capacity: 24 },
  { id: 12, day: 'Sat', time: '10:30', name: 'Family Swim', coach: 'Coach Lena', category: 'Swim', spots: 8, capacity: 16 },
]

export const TRAINERS = [
  { id: 1, name: 'Amara Okoye', role: 'Strength and conditioning', img: 'trainer-amara.webp',
    bio: 'Former sprinter, 11 years coaching. Builds lifting plans around how you move.' },
  { id: 2, name: 'Idris Rahman', role: 'Cardio and functional', img: 'trainer-idris.webp',
    bio: 'Marathon pacer. His classes scale from a first jog to race prep.' },
  { id: 3, name: 'Lena Varga', role: 'Swimming and mobility', img: 'trainer-lena.webp',
    bio: 'Lifeguard turned stroke coach. Fixes your catch in the pool and your hips on land.' },
]

export const PLANS = [
  { id: 1, name: 'Basic', price: 25, note: 'Essential package for regular workouts.', featured: false, button: 'dark',
    perks: ['Unlimited access to the gym', '1 free group class per month', 'Free access to relaxation areas'] },
  { id: 2, name: 'Standard', price: 35, note: 'Extended package for comprehensive training.', featured: true, button: 'primary',
    perks: ['Unlimited access to the gym', '3 free group classes per month', 'Free access to relaxation areas and sauna'] },
  { id: 3, name: 'Premium', price: 45, note: 'Deluxe package with maximum benefits.', featured: false, button: 'light',
    perks: ['Unlimited access to the gym', 'Unlimited group classes', '2 personal training sessions per month',
      'Free access to relaxation areas, sauna, and pool'] },
]

// Demo accounts. Change these passwords before using this outside a demo.
export const DEMO_USERS = [
  { name: 'FFL Admin', email: 'admin@ffl.com', password: 'Admin123!', role: 'admin' },
  { name: 'Amara Okoye', email: 'amara@ffl.com', password: 'Trainer123!', role: 'manager', trainer: 'Amara Okoye' },
  { name: 'Idris Rahman', email: 'idris@ffl.com', password: 'Trainer123!', role: 'manager', trainer: 'Idris Rahman' },
  { name: 'Lena Varga', email: 'lena@ffl.com', password: 'Trainer123!', role: 'manager', trainer: 'Lena Varga' },
  { name: 'Demo Member', email: 'member@ffl.com', password: 'Member123!', role: 'member' },
]

