import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Reminder, HubStatus, Pillbox } from '../types';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const IS_DEV = import.meta.env.DEV;

// Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock Data Store (for development)
let mockReminders: Reminder[] = [
  { id: '1', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6], enabled: true, boxId: 1, label: 'Morning Meds' },
  { id: '2', time: '20:00', days: [0, 1, 2, 3, 4, 5, 6], enabled: true, boxId: 2, label: 'Evening Meds' },
];

let mockPillboxes: Pillbox[] = [
  { id: 1, isConnected: true, hasPill: true, isOpen: false, lastHeartbeat: Date.now() },
  { id: 2, isConnected: true, hasPill: false, isOpen: false, lastHeartbeat: Date.now() },
  { id: 3, isConnected: false, hasPill: false, isOpen: false, lastHeartbeat: Date.now() - 3600000 },
];

let mockHubStatus: HubStatus = {
  wifiConnected: true,
  mqttConnected: true,
  ipAddress: '192.168.1.100',
  uptime: 3600,
  time: new Date().toISOString(),
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions
export const api = {
  // Get all reminders
  getReminders: async (): Promise<Reminder[]> => {
    if (IS_DEV) {
      await delay(500);
      return [...mockReminders];
    }
    const response = await apiClient.get<Reminder[]>('/reminders');
    return response.data;
  },

  // Add a new reminder
  addReminder: async (reminder: Omit<Reminder, 'id'>): Promise<Reminder> => {
    if (IS_DEV) {
      await delay(500);
      const newReminder: Reminder = {
        ...reminder,
        id: Math.random().toString(36).substr(2, 9),
      };
      mockReminders.push(newReminder);
      return newReminder;
    }
    const response = await apiClient.post<Reminder>('/reminders', reminder);
    return response.data;
  },

  // Update a reminder
  updateReminder: async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
    if (IS_DEV) {
      await delay(300);
      const index = mockReminders.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Reminder not found');
      
      mockReminders[index] = { ...mockReminders[index], ...updates };
      return mockReminders[index];
    }
    const response = await apiClient.put<Reminder>(`/reminders/${id}`, updates);
    return response.data;
  },

  // Delete a reminder
  deleteReminder: async (id: string): Promise<void> => {
    if (IS_DEV) {
      await delay(300);
      mockReminders = mockReminders.filter(r => r.id !== id);
      return;
    }
    await apiClient.delete(`/reminders/${id}`);
  },

  // Get system status (Hub + Pillboxes)
  getSystemStatus: async (): Promise<{ hub: HubStatus; pillboxes: Pillbox[] }> => {
    if (IS_DEV) {
      await delay(200);
      return { hub: { ...mockHubStatus, time: new Date().toISOString() }, pillboxes: [...mockPillboxes] };
    }
    const response = await apiClient.get<{ hub: HubStatus; pillboxes: Pillbox[] }>('/status');
    return response.data;
  },

  // Trigger a test alarm/action on a pillbox
  triggerPillboxAction: async (boxId: number, action: 'open' | 'blink' | 'alarm'): Promise<void> => {
    if (IS_DEV) {
      await delay(500);
      console.log(`[Mock API] Triggered ${action} on box ${boxId}`);
      
      // Update mock state for visual feedback if needed
      const box = mockPillboxes.find(p => p.id === boxId);
      if (box && action === 'open') box.isOpen = true;
      
      return;
    }
    await apiClient.post(`/pillbox/${boxId}/${action}`);
  },
  
  // Set mapping mode (for identifying boxes)
  setMappingMode: async (enabled: boolean): Promise<void> => {
    if (IS_DEV) {
      console.log(`[Mock API] Mapping mode ${enabled ? 'enabled' : 'disabled'}`);
      return;
    }
    await apiClient.post('/system/mapping', { enabled });
  },

  // Bind (or re-bind) a pillbox to a grid position.
  // Called both during initial mapping and when the user drags a pill icon to a new cell.
  bindPillbox: async (boxId: number, row: number, col: number): Promise<void> => {
    if (IS_DEV) {
      await delay(200);
      console.log(`[Mock API] bindPillbox: box ${boxId} → (row: ${row}, col: ${col})`);
      // Update the mock pillboxes store so any future getSystemStatus() calls
      // reflect the new position.
      const box = mockPillboxes.find(p => p.id === boxId);
      if (box) {
        (box as Pillbox & { row?: number; col?: number }).row = row;
        (box as Pillbox & { row?: number; col?: number }).col = col;
      }
      return;
    }
    // Real device endpoint: PUT /pillbox/:id/position { row, col }
    await apiClient.put(`/pillbox/${boxId}/position`, { row, col });
  },
};

export default api;
