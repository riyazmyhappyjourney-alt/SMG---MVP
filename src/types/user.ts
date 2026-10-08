export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  provider: 'google' | 'phone' | 'email';
  token: string;
  createdAt: string;
}
