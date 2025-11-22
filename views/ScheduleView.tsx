import React, { useState } from 'react';
import { AppData, DayOfWeek, Shift, PERIODS, DAYS, ScheduleItem } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import * as storage from '../services/storage';
import { Modal } from '../components/Modal';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const ScheduleView: React.FC<Props> = ({ data, setData }) => {
  const [selectedShift, setSelectedShift] = useState<Shift>(Shift.First);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{classId: string, period: number} | null>(null);
  const [tempItem, setTempItem] = useState<Partial<ScheduleItem>>({});

  const getScheduleItem = (classId: string, period: number) => {
    return data.schedule.find(s => 
      s.classId === classId && 
      s.period === period && 
      s.day === selectedDay && 
      s.shift === selectedShift
    );
  };

  const handleCellClick = (classId: string, period: number) => {
    const existing = getScheduleItem(classId, period);
    setEditingCell({ classId, period });
    setTempItem(existing ? { ...existing } : { classId, period, day: selectedDay, shift: selectedShift });
    setIsEditorOpen(true);
  };

  const handleSaveItem = () => {
    if (!tempItem.subjectId || !tempItem.teacherId) {
      alert("Выберите предмет и учителя");
      return;
    }

    // Check conflicts
    const conflict = data.schedule.find(s => 
      s.teacherId === tempItem.teacherId && 
      s.day === selectedDay && 
      s.period === tempItem.period &&
      s.shift === selectedShift &&
      s.id !== tempItem.id // excluding self if editing
    );

    if (conflict) {
        const conflictClass = data.classes.find(c => c.id === conflict.classId)?.name;
        if (!confirm(`Этот учитель уже занят в классе ${conflictClass} на этом уроке. Всё равно назначить?`)) {
            return;
        }
    }

    const newData = { ...data };
    // Remove existing for this cell
    newData.schedule = newData.schedule.filter(s => 
      !(s.classId === editingCell?.classId && 
        s.period === editingCell?.period && 
        s.day === selectedDay && 
        s.shift === selectedShift)
    );

    // Add new
    newData.schedule.push({
      ...tempItem,
      id: tempItem.id || storage.generateId(),
      day: selectedDay,
      shift: selectedShift,
      classId: editingCell!.classId,
      period: editingCell!.period
    } as ScheduleItem);

    setData(newData);
    storage.saveData(newData);
    setIsEditorOpen(false);
  };

  const handleDeleteItem = () => {
    if (!tempItem.id) return;
    const newData = { ...data };
    newData.schedule = newData.schedule.filter(s => s.id !== tempItem.id);
    setData(newData);
    storage.saveData(newData);
    setIsEditorOpen(false);
  };

  // Filter teachers by subject
  const availableTeachers = data.teachers.filter(t => 
    !tempItem.subjectId || t.subjectIds.includes(tempItem.subjectId)
  );

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-2 items-center">
          <select 
            value={selectedShift} 
            onChange={(e) => setSelectedShift(e.target.value as Shift)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={Shift.First}>{Shift.First}</option>
            <option value={Shift.Second}>{Shift.Second}</option>
          </select>

          <div className="h-8 w-px bg-gray-300 mx-2"></div>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDay === day ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
           Нажмите на ячейку для редактирования
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b border-r border-gray-200 text-left text-xs font-bold text-gray-500 w-20 bg-gray-50 sticky left-0 z-20">Класс</th>
                {PERIODS.map(p => (
                  <th key={p} className="p-3 border-b border-gray-200 text-center text-xs font-bold text-gray-500 min-w-[140px]">
                    {p} Урок
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.classes.map(cls => (
                <tr key={cls.id} className="hover:bg-blue-50/30">
                  <td className="p-3 border-r border-gray-200 font-bold text-gray-700 sticky left-0 bg-white z-10 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {cls.name}
                  </td>
                  {PERIODS.map(p => {
                    const item = getScheduleItem(cls.id, p);
                    const subject = data.subjects.find(s => s.id === item?.subjectId);
                    const teacher = data.teachers.find(t => t.id === item?.teacherId);

                    return (
                      <td 
                        key={p} 
                        onClick={() => handleCellClick(cls.id, p)}
                        className="p-2 border-r border-dashed border-gray-200 h-20 align-top cursor-pointer hover:bg-blue-50 transition-colors relative group"
                      >
                        {item ? (
                          <div className={`h-full w-full rounded p-2 text-xs border-l-4 shadow-sm flex flex-col justify-between bg-white`} style={{ borderLeftColor: subject?.color || '#ccc' }}>
                            <div className="font-bold truncate text-gray-900" title={subject?.name}>{subject?.name}</div>
                            <div className="text-gray-600 truncate" title={teacher?.name}>{teacher?.name}</div>
                            {item.roomId && <div className="text-[10px] text-gray-400 text-right">{item.roomId}</div>}
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-300">
                            <Plus size={20} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        title={`Редактирование: ${data.classes.find(c => c.id === editingCell?.classId)?.name}, ${selectedDay}, Урок ${editingCell?.period}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={tempItem.subjectId || ''}
              onChange={e => {
                  setTempItem({...tempItem, subjectId: e.target.value, teacherId: ''}); // Reset teacher when subject changes
              }}
            >
              <option value="">-- Выберите предмет --</option>
              {data.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Учитель</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
              value={tempItem.teacherId || ''}
              onChange={e => setTempItem({...tempItem, teacherId: e.target.value})}
              disabled={!tempItem.subjectId}
            >
              <option value="">-- Выберите учителя --</option>
              {/* Show recommended first, then others */}
              <optgroup label="Рекомендуемые (ведут предмет)">
                {availableTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
              <optgroup label="Остальные">
                {data.teachers
                  .filter(t => !t.subjectIds.includes(tempItem.subjectId || ''))
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))
                }
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Кабинет</label>
            <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                value={tempItem.roomId || ''}
                onChange={e => setTempItem({...tempItem, roomId: e.target.value})}
                placeholder="№ кабинета"
            />
          </div>

          <div className="flex justify-between pt-4 border-t mt-4">
            {tempItem.id ? (
              <button 
                onClick={handleDeleteItem}
                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
              >
                <Trash2 size={16}/> Удалить
              </button>
            ) : <div></div>}
            <div className="flex gap-2">
              <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleSaveItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">Сохранить</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};