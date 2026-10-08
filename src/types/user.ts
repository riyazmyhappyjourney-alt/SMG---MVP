export interface UserAuthProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google';
  token: string;
  createdAt: string;
}
