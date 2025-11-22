export enum DayOfWeek {
  Monday = 'Пн',
  Tuesday = 'Вт',
  Wednesday = 'Ср',
  Thursday = 'Чт',
  Friday = 'Пт',
  Saturday = 'Сб'
}

export enum Shift {
  First = '1 смена',
  Second = '2 смена'
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex code
}

export interface Teacher {
  id: string;
  name: string;
  subjectIds: string[]; // IDs of subjects they can teach
  unavailableDates: string[]; // ISO date strings YYYY-MM-DD
  contactInfo?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., "5А", "11Б"
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  shift: Shift;
  period: number; // 1-8
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
}

export interface Substitution {
  id: string;
  date: string; // YYYY-MM-DD
  scheduleItemId: string;
  originalTeacherId: string;
  replacementTeacherId: string | null; // null if not yet found/cancelled
  note?: string;
}

export interface AppData {
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassGroup[];
  schedule: ScheduleItem[];
  substitutions: Substitution[];
}

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
export const DAYS = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday
];
