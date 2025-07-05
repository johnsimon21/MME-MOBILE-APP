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