
import { IndianState } from './location';

export type IssueStatus = 'reported' | 'in-progress' | 'resolved' | 'closed';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export type IssueCategory = 
  | 'roads' 
  | 'water' 
  | 'electricity' 
  | 'sanitation' 
  | 'public-spaces' 
  | 'transportation' 
  | 'other';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  state?: IndianState;
  district?: string;
  city?: string;
  village?: string;
  pincode?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: GeoLocation;
  reportedBy: string;
  reportedAt: Date;
  images: string[];
  duration: string; // How long the issue has been present
  upvotes: number;
  comments: IssueComment[];
  updates?: IssueUpdate[];
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface IssueUpdate {
  id: string;
  issueId: string;
  content: string;
  newStatus?: IssueStatus;
  createdAt: Date;
  createdBy: string;
}

// Mock user data until we implement authentication
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
