export const NAV = [
  {
    label: 'About',
    href: '#about',
    children: [
      { label: 'Our story', href: '#about', description: 'Who we are and what drives the studio.' },
      { label: 'Why choose FFL', href: '#why', description: 'Facilities, coaching and community.' },
      { label: 'Meet the coaches', href: '#trainers', description: 'Train with specialists who care.' },
    ],
  },
  {
    label: 'Training',
    href: '#services',
    children: [
      { label: 'Services', href: '#services', description: 'Personal training, classes, swim and recovery.' },
      { label: 'Class schedule', href: '#schedule', description: 'See the week and reserve your spot.' },
      { label: 'Membership plans', href: '#membership', description: 'Simple pricing for every goal.' },
    ],
  },
  { label: 'Contact', href: '#contact' },
]

export const CONTACT_TOPICS = [
  { value: 'free-trial', label: 'Free trial week' },
  { value: 'membership', label: 'Membership plans' },
  { value: 'personal-training', label: 'Personal training' },
  { value: 'group-classes', label: 'Group classes' },
  { value: 'other', label: 'Something else' },
]

export const TAGS = ['Personal Training', 'Strength', 'Group Classes', 'Swimming', 'Cardio Equipment', 'Functional Workouts']
export const AVATARS = ['person-1.webp', 'person-2.webp', 'person-3.webp']

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

export const HOURS = ['Mon to Fri: 6:00 to 22:00', 'Saturday: 8:00 to 20:00', 'Sunday: Closed']
export const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
]