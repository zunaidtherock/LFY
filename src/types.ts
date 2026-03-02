export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export interface User {
  id: number;
  name: string;
  email: string;
  blood_group: string;
  phone: string;
  profile_photo?: string;
  total_donations: number;
  availability: number;
  latitude?: number;
  longitude?: number;
  last_donation_date?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'emergency' | 'eligibility' | 'info';
  title: string;
  message: string;
  related_id?: number;
  is_read: number;
  created_at: string;
}
