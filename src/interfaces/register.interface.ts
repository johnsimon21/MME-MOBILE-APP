import { Gender, Grade, School, UserRole } from "./index.interface";

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
    schoolYear: number | null;
    maxMenteeNumber: number | null;
};
