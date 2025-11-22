import React, { useState } from 'react';
import { AppData, Teacher, Subject, ClassGroup } from '../types';
import { Plus, Trash2, Edit2, User, BookOpen, Users } from 'lucide-react';
import * as storage from '../services/storage';
import { Modal } from '../components/Modal';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const DirectoryView: React.FC<Props> = ({ data, setData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'subjects' | 'classes'>('teachers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Temporary state for forms
  const [tempTeacher, setTempTeacher] = useState<Partial<Teacher>>({ subjectIds: [] });
  const [tempSubject, setTempSubject] = useState<Partial<Subject>>({ color: '#e5e7eb' });
  const [tempClass, setTempClass] = useState<Partial<ClassGroup>>({});

  const handleSave = () => {
    setData(prev => {
        const newData = { ...prev };
        
        if (activeSubTab === 'teachers') {
          if (tempTeacher.id) {
            newData.teachers = prev.teachers.map(t => t.id === tempTeacher.id ? { ...t, ...tempTeacher } as Teacher : t);
          } else {
            newData.teachers = [...prev.teachers, { ...tempTeacher, id: storage.generateId(), unavailableDates: [] } as Teacher];
          }
        } else if (activeSubTab === 'subjects') {
          if (tempSubject.id) {
            newData.subjects = prev.subjects.map(s => s.id === tempSubject.id ? { ...s, ...tempSubject } as Subject : s);
          } else {
            newData.subjects = [...prev.subjects, { ...tempSubject, id: storage.generateId() } as Subject];
          }
        } else {
          if (tempClass.id) {
            newData.classes = prev.classes.map(c => c.id === tempClass.id ? { ...c, ...tempClass } as ClassGroup : c);
          } else {
            newData.classes = [...prev.classes, { ...tempClass, id: storage.generateId() } as ClassGroup];
          }
        }
    
        storage.saveData(newData);
        return newData;
    });

    setIsModalOpen(false);
    setTempTeacher({ subjectIds: [] });
    setTempSubject({ color: '#e5e7eb' });
    setTempClass({});
  };

  const handleDelete = (id: string, type: 'teachers' | 'subjects' | 'classes') => {
    if (!window.confirm('Вы уверены? Это может повлиять на расписание.')) return;
    
    setData(prev => {
        let newData = { ...prev };
        
        if (type === 'teachers') {
          newData = { ...newData, teachers: prev.teachers.filter(t => t.id !== id) };
        } else if (type === 'subjects') {
          newData = { ...newData, subjects: prev.subjects.filter(s => s.id !== id) };
        } else if (type === 'classes') {
          newData = { ...newData, classes: prev.classes.filter(c => c.id !== id) };
        }
        
        storage.saveData(newData);
        return newData;
    });
  };

  const inputClass = "w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors";

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Sub-nav */}
      <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm w-fit border border-gray-200">
        <button onClick={() => setActiveSubTab('teachers')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${activeSubTab === 'teachers' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><User size={16}/> Учителя</button>
        <button onClick={() => setActiveSubTab('subjects')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${activeSubTab === 'subjects' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><BookOpen size={16}/> Предметы</button>
        <button onClick={() => setActiveSubTab('classes')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${activeSubTab === 'classes' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users size={16}/> Классы</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">
            {activeSubTab === 'teachers' ? 'Список учителей' : activeSubTab === 'subjects' ? 'Список предметов' : 'Список классов'}
          </h2>
          <button 
            onClick={() => {
              setTempTeacher({ subjectIds: [] });
              setTempSubject({ color: '#e5e7eb' });
              setTempClass({});
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> Добавить
          </button>
        </div>

        <div className="overflow-y-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b sticky top-0">
              <tr>
                <th className="px-6 py-3 font-semibold">Название / Имя</th>
                <th className="px-6 py-3 font-semibold">Детали</th>
                <th className="px-6 py-3 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeSubTab === 'teachers' && data.teachers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-6 py-3 text-gray-500">
                    <div className="flex gap-1 flex-wrap">
                      {t.subjectIds.map(sid => {
                        const subj = data.subjects.find(s => s.id === sid);
                        return subj ? (
                          <span key={sid} className="px-2 py-0.5 rounded text-xs border" style={{backgroundColor: subj.color + '40', borderColor: subj.color}}>
                            {subj.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button type="button" onClick={() => { setTempTeacher(t); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"><Edit2 size={16}/></button>
                    <button type="button" onClick={() => handleDelete(t.id, 'teachers')} className="p-1.5 text-gray-400 hover:text-red-600 ml-2 transition-colors rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
               {activeSubTab === 'subjects' && data.subjects.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: s.color }}></div>
                    {s.name}
                  </td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs uppercase">{s.color}</td>
                  <td className="px-6 py-3 text-right">
                    <button type="button" onClick={() => { setTempSubject(s); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"><Edit2 size={16}/></button>
                    <button type="button" onClick={() => handleDelete(s.id, 'subjects')} className="p-1.5 text-gray-400 hover:text-red-600 ml-2 transition-colors rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
               {activeSubTab === 'classes' && data.classes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-3 text-gray-500"></td>
                  <td className="px-6 py-3 text-right">
                     <button type="button" onClick={() => { setTempClass(c); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"><Edit2 size={16}/></button>
                     <button type="button" onClick={() => handleDelete(c.id, 'classes')} className="p-1.5 text-gray-400 hover:text-red-600 ml-2 transition-colors rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeSubTab === 'teachers' ? 'Учитель' : activeSubTab === 'subjects' ? 'Предмет' : 'Класс'}
      >
        <div className="space-y-4">
          {activeSubTab === 'teachers' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={tempTeacher.name || ''}
                  onChange={e => setTempTeacher({...tempTeacher, name: e.target.value})}
                  placeholder="Иванов И.И."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Предметы</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 grid grid-cols-1 gap-2 bg-white">
                  {data.subjects.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={tempTeacher.subjectIds?.includes(s.id)}
                        onChange={e => {
                          const current = tempTeacher.subjectIds || [];
                          setTempTeacher({
                            ...tempTeacher,
                            subjectIds: e.target.checked 
                              ? [...current, s.id]
                              : current.filter(id => id !== s.id)
                          });
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                  {data.subjects.length === 0 && <div className="text-xs text-gray-400 p-1">Нет предметов</div>}
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'subjects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={tempSubject.name || ''}
                  onChange={e => setTempSubject({...tempSubject, name: e.target.value})}
                  placeholder="Математика"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-20 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                    value={tempSubject.color || '#ffffff'}
                    onChange={e => setTempSubject({...tempSubject, color: e.target.value})}
                  />
                  <span className="text-sm text-gray-500">{tempSubject.color}</span>
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'classes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input 
                type="text" 
                className={inputClass}
                value={tempClass.name || ''}
                onChange={e => setTempClass({...tempClass, name: e.target.value})}
                placeholder="5А"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Отмена</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">Сохранить</button>
        </div>
      </Modal>
    </div>
  );
};