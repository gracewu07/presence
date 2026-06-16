export const users = [
  {
    id: 'm01',
    name: 'Jordan Brooks',
    email: 'member@presence.app',
    role: 'member',
    points: 142,
    rank: 'Sergeant at Arms',
    status: 'active',
    location: 'Chapel Hill',
  },
  {
    id: 'a01',
    name: 'Taylor Kim',
    email: 'admin@presence.app',
    role: 'admin',
    points: 248,
    rank: 'VP of Standards',
    status: 'active',
    location: 'Chapel Hill',
  },
];

export const currentUser = {
  id: 'm01',
  name: 'Jordan Brooks',
  email: 'member@presence.app',
  role: 'member',
  points: 142,
  rank: 'Sergeant at Arms',
  location: 'Chapel Hill',
};

export const events = [
  {
    id: 'e01',
    title: 'AI Workshop',
    type: 'Professional Development',
    date: 'Jun 18',
    time: '6:30 PM',
    location: 'Carolina Union',
    points: 10,
    status: 'open',
    capacity: 120,
  },
  {
    id: 'e02',
    title: 'Chapter Check-In',
    type: 'Attendance',
    date: 'Jun 20',
    time: '5:00 PM',
    location: 'Student Union',
    points: 8,
    status: 'open',
    capacity: 80,
  },
  {
    id: 'e03',
    title: 'Community Service',
    type: 'Community Service',
    date: 'Jun 22',
    time: '10:00 AM',
    location: 'Campus Garden',
    points: 12,
    status: 'full',
    capacity: 50,
  },
  {
    id: 'e04',
    title: 'Chapter Dinner',
    type: 'Social',
    date: 'Jun 25',
    time: '7:00 PM',
    location: 'Dining Hall',
    points: 6,
    status: 'open',
    capacity: 100,
  },
];

export const calendarEvents = [
  {
    id: 'c01',
    title: 'Officer Huddle',
    date: 'Jun 17',
    time: '4:00 PM',
    category: 'Meeting',
  },
  {
    id: 'c02',
    title: 'Networking Brunch',
    date: 'Jun 21',
    time: '11:00 AM',
    category: 'Social',
  },
  {
    id: 'c03',
    title: 'Check-In',
    date: 'Jun 23',
    time: '1:00 PM',
    category: 'Attendance',
  },
];

export const members = [
  {
    id: 'm01',
    name: 'Jordan Brooks',
    role: 'Member',
    points: 142,
    location: 'Chapel Hill',
    status: 'active',
  },
  {
    id: 'm02',
    name: 'Avery Chen',
    role: 'Risk Manager',
    points: 160,
    location: 'UNC',
    status: 'active',
  },
  {
    id: 'm03',
    name: 'Noah Patel',
    role: 'Member',
    points: 129,
    location: 'UNC',
    status: 'remote',
  },
  {
    id: 'm04',
    name: 'Mia Carter',
    role: 'Member',
    points: 118,
    location: 'UNC',
    status: 'active',
  },
  {
    id: 'm05',
    name: 'Evan Jackson',
    role: 'Member',
    points: 167,
    location: 'UNC',
    status: 'active',
  },
];

export const excusalRequests = [
  {
    id: 'r01',
    name: 'Avery Chen',
    event: 'Community Service',
    date: 'Jun 22',
    status: 'pending',
  },
  {
    id: 'r02',
    name: 'Noah Patel',
    event: 'Chapter Dinner',
    date: 'Jun 25',
    status: 'approved',
  },
];

export const adminStats = [
  {
    label: 'Total members',
    value: '128',
  },
  {
    label: 'Events this month',
    value: '12',
  },
  {
    label: 'Pending excusals',
    value: '4',
  },
  {
    label: 'Check-ins today',
    value: '53',
  },
];
