
export enum UserRole {
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  COORDINATOR = 'coordinator'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum School {
  CAXITO = 'CAXITO',
  MALANJE = 'MALANJE',
  NDALATANDO = 'NDALATANDO',
  ONDJIVA = 'ONDJIVA'
}

export enum Grade {
  GRADE_10 = '10',
  GRADE_11 = '11',
  GRADE_12 = '12'
}

export interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCoordinator: boolean;
  isMentor: boolean;
  isMentee: boolean;
}