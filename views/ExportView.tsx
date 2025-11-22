import React, { useRef, useState } from 'react';
import { AppData, DAYS } from '../types';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  data: AppData;
}

export const ExportView: React.FC<Props> = ({ data }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const subList = data.substitutions.filter(s => s.date === date);
  
  // Get full details
  const rows = subList.map(sub => {
    const schedule = data.schedule.find(s => s.id === sub.scheduleItemId);
    if (!schedule) return null;
    
    const teacher = data.teachers.find(t => t.id === sub.originalTeacherId);
    const replacement = data.teachers.find(t => t.id === sub.replacementTeacherId);
    const subject = data.subjects.find(s => s.id === schedule.subjectId);
    const cls = data.classes.find(c => c.id === schedule.classId);

    return { schedule, teacher, replacement, subject, cls, sub };
  }).filter(Boolean).sort((a, b) => {
      if (a!.schedule.shift !== b!.schedule.shift) return a!.schedule.shift.localeCompare(b!.schedule.shift);
      return a!.schedule.period - b!.schedule.period;
  });

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // High res
        backgroundColor: '#ffffff',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Замены_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании изображения");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 bg-gray-100">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Дата отчета:</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <button 
          onClick={handleDownload}
          disabled={isGenerating || rows.length === 0}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isGenerating ? 'Генерация...' : <><Download size={20}/> Скачать PNG</>}
        </button>
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-4">
        {rows.length === 0 ? (
          <div className="text-gray-400 flex flex-col items-center justify-center h-full">
            <ImageIcon size={48} className="mb-4 opacity-50"/>
            <p>Нет замен на выбранную дату</p>
          </div>
        ) : (
          /* Preview Container */
          <div className="w-full max-w-[800px]">
            <div 
              ref={printRef} 
              className="bg-white p-8 shadow-lg min-h-[600px]"
              style={{ fontFamily: 'Times New Roman, serif' }} // Print look
            >
              <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase mb-2 text-black">Гимназия: Изменения в расписании</h1>
                <h2 className="text-xl text-black">на {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              </div>

              <table className="w-full border-collapse border border-black text-left text-sm text-black">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-2 text-center w-16 font-bold">Смена</th>
                    <th className="border border-black p-2 text-center w-16 font-bold">Урок</th>
                    <th className="border border-black p-2 w-20 font-bold">Класс</th>
                    <th className="border border-black p-2 font-bold">Предмет</th>
                    <th className="border border-black p-2 font-bold">Кто отсутствует</th>
                    <th className="border border-black p-2 font-bold bg-gray-300">Кто заменяет</th>
                    <th className="border border-black p-2 w-16 text-center font-bold">Каб.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-2 text-center">{row!.schedule.shift === '1 смена' ? 'I' : 'II'}</td>
                      <td className="border border-black p-2 text-center">{row!.schedule.period}</td>
                      <td className="border border-black p-2 font-bold">{row!.cls?.name}</td>
                      <td className="border border-black p-2">{row!.subject?.name}</td>
                      <td className="border border-black p-2 italic text-gray-600">{row!.teacher?.name}</td>
                      <td className="border border-black p-2 font-bold">{row!.replacement?.name || '???'}</td>
                      <td className="border border-black p-2 text-center">{row!.schedule.roomId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 text-sm text-right text-gray-500">
                Сформировано автоматически: {new Date().toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};