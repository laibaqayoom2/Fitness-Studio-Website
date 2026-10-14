export const NAV = [
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Trainers', href: '#trainers' },
  { label: 'Plans', href: '#membership' },
]

export const TAGS = ['Personal Training', 'Strength', 'Group Classes', 'Swimming', 'Cardio Equipment', 'Functional Workouts']
export const AVATARS = ['person-1.jpg', 'person-2.jpg', 'person-3.jpg']

export const STATS = [
  { value: '12', label: 'Years of Excellence' },
  { value: '27K', label: 'Members' },
  { value: '60', label: 'Weekly Classes' },
  { value: '117', label: 'Expert Trainers' },
]

export const SERVICES = [
  { id: 1, label: 'Personal training', img: 'personal.webp', alt: 'Coach spotting a lifter' },
  { id: 2, label: 'Fitness Classes', img: 'class.webp', alt: 'Group class mid-session' },
  { id: 3, label: 'Swim Training', img: 'swim.webp', alt: 'Swimmers in the pool' },
  { id: 4, label: 'Recovery', img: 'recovery.webp', alt: 'Recovery and mobility area' },
]

export const WHY = [
  { id: 1, lead: 'State-of-the-Art', rest: 'Equipment', open: false,
    body: 'Modern racks, cardio decks and free weights, serviced every week.' },
  { id: 2, lead: 'Expert', rest: 'Trainers', open: true,
    body: 'Our certified trainers are here to guide you every step of the way, offering personalized workout plans and expert advice. With years of experience, they ensure that your workouts are both safe and effective.' },
  { id: 3, lead: 'Wide Range', rest: 'of Classes', open: false,
    body: 'Strength, cardio, swimming and mobility, 60+ sessions every week.' },
  { id: 4, lead: 'Welcoming', rest: 'Community', open: false,
    body: 'Train beside members at every level, with nobody left behind.' },
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const CATEGORIES = ['All', 'Strength', 'Cardio', 'Swim', 'Mobility']

// Main grid. `spots` = places still open in that class.
export const CLASSES = [
  { id: 1, day: 'Mon', time: '06:30', name: 'Strength Lab', coach: 'Coach Amara', category: 'Strength', spots: 8 },
  { id: 2, day: 'Mon', time: '18:30', name: 'Swim Skills', coach: 'Coach Lena', category: 'Swim', spots: 6 },
  { id: 3, day: 'Tue', time: '07:00', name: 'Functional Flow', coach: 'Coach Idris', category: 'Cardio', spots: 10 },
  { id: 4, day: 'Tue', time: '17:45', name: 'Group Strength', coach: 'Coach Amara', category: 'Strength', spots: 12 },
  { id: 5, day: 'Wed', time: '12:15', name: 'Mobility Reset', coach: 'Coach Lena', category: 'Mobility', spots: 15 },
  { id: 6, day: 'Wed', time: '19:00', name: 'Cardio Burn', coach: 'Coach Idris', category: 'Cardio', spots: 14 },
  { id: 7, day: 'Thu', time: '07:00', name: 'Swim Training', coach: 'Coach Lena', category: 'Swim', spots: 6 },
  { id: 8, day: 'Thu', time: '18:00', name: 'Functional Flow', coach: 'Coach Idris', category: 'Cardio', spots: 10 },
  { id: 9, day: 'Fri', time: '06:30', name: 'Group Strength', coach: 'Coach Amara', category: 'Strength', spots: 12 },
  { id: 10, day: 'Fri', time: '17:30', name: 'Open Floor', coach: 'All coaches', category: 'Strength', spots: 20 },
  { id: 11, day: 'Sat', time: '09:00', name: 'Long Cardio', coach: 'Coach Idris', category: 'Cardio', spots: 16 },
  { id: 12, day: 'Sat', time: '10:30', name: 'Family Swim', coach: 'Coach Lena', category: 'Swim', spots: 8 },
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

export const HOURS = ['Mon to Fri: 6:00 to 22:00', 'Saturday: 8:00 to 20:00', 'Sunday: 9:00 to 18:00']
export const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
]