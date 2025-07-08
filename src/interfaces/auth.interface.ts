import { Gender, Grade, School, UserRole } from "./index.interface";


export interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCoordinator: boolean;
  isMentor: boolean;
  isMentee: boolean;
}

export type FormData1 = {
  role: UserRole;
  fullName: string;
  gender: Gender;
  birth: Date;
  cellphone: string;
  email: string;
};

export type FormData2 = {
  school: School;
  grade: Grade | null;
  password: string;
  schoolYear: string | null;
  province: string;
  municipality: string;
  maxMenteeNumber: number | null;
};

export interface UserRegisterData extends FormData1, FormData2 { }