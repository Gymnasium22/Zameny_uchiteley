import React, { useState, useMemo } from 'react';
import { AppData, DayOfWeek, Substitution, DAYS } from '../types';
import { Calendar, AlertCircle, CheckCircle, UserX, ArrowRight, Search } from 'lucide-react';
import * as storage from '../services/storage';
import { Modal } from '../components/Modal';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const SubstitutionView: React.FC<Props> = ({ data, setData }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  // Substitution Logic State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubParams, setCurrentSubParams] = useState<{scheduleItemId: string, subjectId: string, period: number, shift: string} | null>(null);

  // Derived State
  const selectedDayOfWeek = useMemo(() => {
    const dayIndex = new Date(selectedDate).getDay(); // 0 = Sun, 1 = Mon...
    // Adjust for Russian (Mon is 0 in our array)
    // JS getDay: 0=Sun, 1=Mon... 6=Sat. 
    if (dayIndex === 0) return null; // Sunday no school
    return DAYS[dayIndex - 1];
  }, [selectedDate]);

  const absentTeachers = useMemo(() => {
    // Teachers manually marked unavailable for this date
    return data.teachers.filter(t => t.unavailableDates.includes(selectedDate));
  }, [data.teachers, selectedDate]);

  const affectedLessons = useMemo(() => {
    if (!selectedDayOfWeek) return [];
    // Find lessons for absent teachers on this day
    const absentIds = absentTeachers.map(t => t.id);
    // Also include the specifically selected teacher in dropdown if any
    if (selectedTeacherId && !absentIds.includes(selectedTeacherId)) absentIds.push(selectedTeacherId);

    return data.schedule.filter(s => s.day === selectedDayOfWeek && absentIds.includes(s.teacherId))
      .sort((a, b) => a.period - b.period);
  }, [data.schedule, selectedDayOfWeek, absentTeachers, selectedTeacherId]);

  const getSubstitution = (scheduleItemId: string) => {
    return data.substitutions.find(s => s.scheduleItemId === scheduleItemId && s.date === selectedDate);
  };

  const handleToggleUnavailable = (teacherId: string) => {
    const teacher = data.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const newData = { ...data };
    const tIndex = newData.teachers.findIndex(t => t.id === teacherId);
    
    if (newData.teachers[tIndex].unavailableDates.includes(selectedDate)) {
      newData.teachers[tIndex].unavailableDates = newData.teachers[tIndex].unavailableDates.filter(d => d !== selectedDate);
    } else {
      newData.teachers[tIndex].unavailableDates.push(selectedDate);
    }
    setData(newData);
    storage.saveData(newData);
  };

  const handleOpenReplacementModal = (scheduleItemId: string, subjectId: string, period: number, shift: string) => {
    setCurrentSubParams({ scheduleItemId, subjectId, period, shift });
    setIsModalOpen(true);
  };

  const handleAssignReplacement = (teacherId: string) => {
    if (!currentSubParams) return;
    const newData = { ...data };
    
    // Check if sub exists
    const existingSubIndex = newData.substitutions.findIndex(s => 
      s.scheduleItemId === currentSubParams.scheduleItemId && s.date === selectedDate
    );

    const originalLesson = newData.schedule.find(s => s.id === currentSubParams.scheduleItemId);

    const newSub: Substitution = {
      id: existingSubIndex >= 0 ? newData.substitutions[existingSubIndex].id : storage.generateId(),
      date: selectedDate,
      scheduleItemId: currentSubParams.scheduleItemId,
      originalTeacherId: originalLesson?.teacherId || '',
      replacementTeacherId: teacherId
    };

    if (existingSubIndex >= 0) {
      newData.substitutions[existingSubIndex] = newSub;
    } else {
      newData.substitutions.push(newSub);
    }

    setData(newData);
    storage.saveData(newData);
    setIsModalOpen(false);
  };

  const handleRemoveSub = (subId: string) => {
    const newData = { ...data };
    newData.substitutions = newData.substitutions.filter(s => s.id !== subId);
    setData(newData);
    storage.saveData(newData);
  };

  // Candidate Finder Logic
  const getCandidates = () => {
    if (!currentSubParams || !selectedDayOfWeek) return [];
    
    return data.teachers.map(teacher => {
      // 1. Is marked absent?
      const isAbsent = teacher.unavailableDates.includes(selectedDate);
      
      // 2. Is busy this period?
      const isBusy = data.schedule.some(s => 
        s.teacherId === teacher.id && 
        s.day === selectedDayOfWeek && 
        s.period === currentSubParams.period &&
        s.shift === currentSubParams.shift
      );

      // 3. Is specialized?
      const isSpecialist = teacher.subjectIds.includes(currentSubParams.subjectId);

      return {
        teacher,
        isAbsent,
        isBusy,
        isSpecialist,
        score: (isAbsent || isBusy ? -100 : 0) + (isSpecialist ? 10 : 0)
      };
    }).sort((a, b) => b.score - a.score); // Sort best first
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Panel: Controls & Absent Teachers */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-6 h-fit">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Дата замены</label>
            <div className="relative">
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18}/>
            </div>
            <div className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedDayOfWeek ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              {selectedDayOfWeek ? `День недели: ${selectedDayOfWeek}` : 'Выходной'}
            </div>
          </div>

          <hr className="border-gray-200"/>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <UserX size={18} className="text-red-500"/> Отсутствующие
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {data.teachers.length === 0 && <div className="text-sm text-gray-400 text-center italic">Нет учителей в базе</div>}
              {data.teachers.map(t => {
                const isAbsent = t.unavailableDates.includes(selectedDate);
                return (
                  <div key={t.id} className={`flex items-center justify-between p-2 rounded border transition-colors ${isAbsent ? 'bg-red-50 border-red-200' : 'border-transparent hover:bg-gray-50'}`}>
                    <span className={`text-sm ${isAbsent ? 'font-medium text-red-700' : 'text-gray-700'}`}>{t.name}</span>
                    <button 
                      onClick={() => handleToggleUnavailable(t.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors border ${isAbsent ? 'bg-white border-red-200 text-red-700 hover:bg-red-50' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {isAbsent ? 'Вернуть' : 'Отметить'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Lessons & Substitutions */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full max-h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="font-bold text-gray-800">Уроки требующие замены</h2>
          </div>
          <div className="overflow-y-auto p-4 flex-1 bg-gray-50/30">
            {affectedLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <CheckCircle size={48} className="text-green-100" />
                <p>Нет уроков у отсутствующих учителей на этот день.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {affectedLessons.map(lesson => {
                  const subject = data.subjects.find(s => s.id === lesson.subjectId);
                  const teacher = data.teachers.find(t => t.id === lesson.teacherId);
                  const cls = data.classes.find(c => c.id === lesson.classId);
                  const sub = getSubstitution(lesson.id);
                  const replacementTeacher = sub ? data.teachers.find(t => t.id === sub.replacementTeacherId) : null;

                  return (
                    <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-mono text-xs bg-gray-100 text-gray-600 border px-2 py-1 rounded">{lesson.shift}</span>
                           <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded">{lesson.period} урок</span>
                           <span className="font-bold text-lg text-gray-900">{cls?.name}</span>
                        </div>
                        <div className="text-gray-900 font-medium ml-1">{subject?.name}</div>
                        <div className="text-sm text-red-500 flex items-center gap-1 mt-1 ml-1">
                           <UserX size={14}/> {teacher?.name} (Отсутствует)
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto justify-end">
                        <ArrowRight className="text-gray-300 hidden sm:block" />
                        
                        {replacementTeacher ? (
                          <div className="text-right bg-green-50 border border-green-100 rounded-lg p-2 min-w-[140px]">
                            <div className="text-xs text-green-600 font-medium mb-1">Заменяет:</div>
                            <div className="font-bold text-green-800 text-sm">{replacementTeacher.name}</div>
                            <button onClick={() => handleRemoveSub(sub!.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline mt-1">Отменить</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleOpenReplacementModal(lesson.id, lesson.subjectId, lesson.period, lesson.shift)}
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center gap-2 text-sm shadow-sm transition-colors w-full sm:w-auto justify-center"
                          >
                            <Search size={16}/> Найти замену
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replacement Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Выбор замены"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-2">
           <div className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
             Показаны учителя, отсортированные по приоритету.
             <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Спец. по предмету</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> Свободен</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Занят</span>
             </div>
           </div>
           
           <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
             {getCandidates().map(({ teacher, isAbsent, isBusy, isSpecialist }) => {
                const canTeach = !isAbsent && !isBusy;
                return (
                  <button 
                    key={teacher.id}
                    disabled={!canTeach}
                    onClick={() => handleAssignReplacement(teacher.id)}
                    className={`w-full text-left p-3 flex items-center justify-between transition-colors
                      ${!canTeach ? 'opacity-50 bg-gray-50 cursor-not-allowed' : 'bg-white hover:bg-blue-50 active:bg-blue-100'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${isAbsent || isBusy ? 'bg-red-500' : isSpecialist ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-xs text-gray-500">
                           {teacher.subjectIds.map(sid => data.subjects.find(s => s.id === sid)?.name).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium">
                      {isAbsent ? <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Отсутствует</span> : 
                       isBusy ? <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Урок в это время</span> : 
                       <span className="text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">Свободен</span>}
                    </div>
                  </button>
                );
             })}
           </div>
        </div>
      </Modal>
    </div>
  );
};