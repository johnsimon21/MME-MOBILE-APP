import { UserRegisterData } from "./auth.interface";
import { School, UserRole } from "./index.interface";

export interface IUser extends UserRegisterData {
  uid: string;
  image?: string;
  portfolio?: string;
  difficulties?: string[];
  skills?: string[];
  emotions?: string[];
  programs?: string[];
}

export interface IUserAuth {
  uid: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  firebaseClaims: {
    name: string;
    role: UserRole;
    uid: string;
    email: string;
    email_verified: boolean;
    school?: School;
    iat: number; 
    exp: number;
    aud: string;
    iss: string;
    sub: string;
  };
  role?: UserRole;
  school?: School;
}

export interface IUserFilters {
  role?: UserRole;
  school?: School;
  search?: string;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface IPaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}