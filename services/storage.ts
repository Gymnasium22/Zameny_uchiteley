import { AppData, Subject, Teacher, ClassGroup, ScheduleItem, Substitution } from '../types';

const STORAGE_KEY = 'gymnasium_data_v1';

const INITIAL_DATA: AppData = {
  subjects: [
    { id: 's1', name: 'Математика', color: '#bfdbfe' }, // blue-200
    { id: 's2', name: 'Русский язык', color: '#bbf7d0' }, // green-200
    { id: 's3', name: 'Литература', color: '#fef08a' }, // yellow-200
    { id: 's4', name: 'Физика', color: '#ddd6fe' }, // violet-200
    { id: 's5', name: 'История', color: '#fed7aa' }, // orange-200
  ],
  teachers: [
    { id: 't1', name: 'Иванова А.А.', subjectIds: ['s1', 's4'], unavailableDates: [] },
    { id: 't2', name: 'Петров Б.Б.', subjectIds: ['s2', 's3'], unavailableDates: [] },
    { id: 't3', name: 'Сидорова В.В.', subjectIds: ['s5'], unavailableDates: [] },
  ],
  classes: [
    { id: 'c1', name: '5А' },
    { id: 'c2', name: '5Б' },
    { id: 'c3', name: '10А' },
  ],
  schedule: [],
  substitutions: []
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load from localStorage", e);
  }
  return INITIAL_DATA;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
