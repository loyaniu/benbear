import { Timestamp } from '@angular/fire/firestore';

export interface UserProfile {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  settings: UserSettings;
}

export interface UserSettings {
  defaultInputMode: 'voice' | 'manual';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultInputMode: 'voice',
};
