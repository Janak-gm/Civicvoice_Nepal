export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface EmergencyContact {
  name: string;
  number: string;
  icon: string;
  bg: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  xp: number;
  issues: number;
  badge: string | null;
  badgeColor?: string;
  bg: string;
  txt: string;
}

export const categories: Category[] = [
  { id: 'all', name: 'All Issues', icon: 'fa-list', color: '#2563eb', count: 2847 },
  { id: 'road', name: 'Roads & Traffic', icon: 'fa-road', color: '#D97706', count: 643 },
  { id: 'water', name: 'Water & Drainage', icon: 'fa-droplet', color: '#2563EB', count: 521 },
  { id: 'waste', name: 'Garbage & Waste', icon: 'fa-recycle', color: '#16A34A', count: 487 },
  { id: 'electricity', name: 'Electricity', icon: 'fa-bolt', color: '#D97706', count: 312 },
  { id: 'health', name: 'Health & Safety', icon: 'fa-hospital', color: '#e3342f', count: 289 },
  { id: 'other', name: 'Others', icon: 'fa-clipboard', color: '#6b7280', count: 397 },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: 'Ramesh Thapa', initials: 'RT', xp: 4280, issues: 89, badge: 'Champion', badgeColor: '#F59E0B', bg: 'rgba(245,158,11,0.15)', txt: '#D97706' },
  { rank: 2, name: 'Sunita Rai', initials: 'SR', xp: 3740, issues: 76, badge: 'Hero', badgeColor: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', txt: '#6B7280' },
  { rank: 3, name: 'Bikash Gurung', initials: 'BG', xp: 3120, issues: 62, badge: 'Activist', badgeColor: '#FB923C', bg: 'rgba(234,88,12,0.15)', txt: '#EA580C' },
  { rank: 4, name: 'Purna Shrestha', initials: 'PS', xp: 2890, issues: 58, badge: null, bg: 'rgba(37,99,235,0.15)', txt: '#2563EB' },
  { rank: 5, name: 'Anita Lama', initials: 'AL', xp: 2450, issues: 49, badge: null, bg: 'rgba(22,163,74,0.15)', txt: '#16A34A' },
];

export const emergencyData: EmergencyContact[] = [
  { name: 'Police', number: '100', icon: 'fa-shield', bg: 'rgba(37,99,235,0.1)' },
  { name: 'Ambulance', number: '102', icon: 'fa-truck-medical', bg: 'rgba(239,68,68,0.1)' },
  { name: 'Fire Dept', number: '101', icon: 'fa-fire-extinguisher', bg: 'rgba(234,88,12,0.1)' },
  { name: 'Disaster Mgmt', number: '1155', icon: 'fa-circle-exclamation', bg: 'rgba(217,119,6,0.1)' },
  { name: 'City Hall', number: '555-0100', icon: 'fa-building', bg: 'rgba(22,163,74,0.1)' },
  { name: 'Water Supply', number: '555-0200', icon: 'fa-droplet', bg: 'rgba(37,99,235,0.1)' },
  { name: 'Power Co.', number: '1153', icon: 'fa-bolt', bg: 'rgba(251,191,36,0.1)' },
  { name: 'Women Helpline', number: '1145', icon: 'fa-person-dress', bg: 'rgba(139,92,246,0.1)' },
];
