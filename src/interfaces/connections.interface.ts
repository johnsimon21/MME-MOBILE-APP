import { Gender, School, UserRole } from "./index.interface";

export enum IConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

export enum IConnectionType {
  SENT = 'sent',
  RECEIVED = 'received'
}

export interface IConnectedUser {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;      // Import from your user interface or redefine if needed
  school: School;      // Import from your user interface or redefine if needed
  image?: string;
  gender: Gender;      // Import from your user interface or redefine if needed
  connectionStatus: 'pending' | 'accepted' | 'blocked';
  connectionType: 'sent' | 'received';
  canCancel: boolean;
  mutualConnections?: number;
}

export interface IFriends {
  id: string;
  fullName: string;
  role: string;
  province: string;
  image: string;
  uid: string;
  email: string;
  school: School;
  gender: Gender;
}

export interface IConnectionResponse {
  id: string;
  connectionId: string;
  status: IConnectionStatus;
  type: IConnectionType;
  connectedUser: IConnectedUser;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface IConnectionsListResponse {
  connections: IConnectionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IConnectionStats {
  totalConnections: number;
  acceptedConnections: number;
  pendingConnections: number;
  sentRequests: number;
  receivedRequests: number;
  blockedUsers: number;
}

export interface IConnectionSuggestion {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  school: string;
  image?: string;
  mutualConnections: number;
  suggestionReason: string;
}
