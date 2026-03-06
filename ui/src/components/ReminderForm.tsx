import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { X, Save, Clock, Calendar, MessageSquare, Pill } from 'lucide-react';

interface ReminderFormProps {
  initialData?: Partial<Reminder>;
  boxId?: number; // Pre-selected box ID
  availableBoxIds: number[];
  onSubmit: (data: Omit<Reminder, 'id'>) => void;
  onCancel: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ReminderForm: React.FC<ReminderFormProps> = ({ 
  initialData, 
  boxId, 
  availableBoxIds,
  onSubmit, 
  onCancel 
}) => {
  const [time, setTime] = useState(initialData?.time || '08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [selectedBoxId, setSelectedBoxId] = useState<number>(boxId || initialData?.boxId || (availableBoxIds[0] ?? 0));
  const [label, setLabel] = useState(initialData?.label || ''); // Serving as TTS text
  const [dosage, setDosage] = useState('1'); // Local state, maybe part of label in future?

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      time,
      days: selectedDays,
      boxId: selectedBoxId,
      enabled: true,
      label: label || `Take ${dosage} pills`, // Fallback or combine
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {initialData ? 'Edit Reminder' : 'New Reminder'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Box Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Pillbox</label>
          <select 
            value={selectedBoxId} 
            onChange={(e) => setSelectedBoxId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {availableBoxIds.map(id => (
              <option key={id} value={id}>Box #{id}</option>
            ))}
          </select>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Clock size={16} /> Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            required
          />
        </div>

        {/* Days Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={16} /> Repeat Days
          </label>
          <div className="flex justify-between gap-1">
            {DAYS.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(index)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                  selectedDays.includes(index)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Pill size={16} /> Dosage
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* TTS / Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <MessageSquare size={16} /> TTS Message / Label
          </label>
          <textarea
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            rows={2}
            placeholder={`e.g., Time to take ${dosage} pills`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Reminder
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReminderForm;
