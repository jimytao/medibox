import { create } from 'zustand';
import { Reminder, HubStatus, Pillbox, WsMessage, StatusUpdatePayload } from '../types';
import { api } from '../api/client';
import { wsService } from '../api/websocket';

// Function to generate mock data for development
const generateMockData = (): { pillboxes: Pillbox[], hubStatus: HubStatus } => {
  const mockPillboxes: Pillbox[] = [
    { id: 1, isConnected: true, hasPill: true, isOpen: false, lastHeartbeat: Date.now(), row: 0, col: 1 },
    { id: 2, isConnected: true, hasPill: false, isOpen: true, lastHeartbeat: Date.now(), row: 1, col: 0 },
    { id: 3, isConnected: false, hasPill: false, isOpen: false, lastHeartbeat: 0, row: 1, col: 1 },
    { id: 4, isConnected: true, hasPill: true, isOpen: false, lastHeartbeat: Date.now(), row: 2, col: 2 },
  ];
  const mockHubStatus: HubStatus = {
    wifiConnected: true,
    mqttConnected: true,
    ipAddress: '192.168.1.100',
    uptime: 123456,
    time: new Date().toISOString(),
  };
  return { pillboxes: mockPillboxes, hubStatus: mockHubStatus };
};


interface StoreState {
  reminders: Reminder[];
  pillboxes: Pillbox[];
  hubStatus: HubStatus | null;
  isLoading: boolean;
  error: string | null;
  mappingMode: {
    enabled: boolean;
    blinkingBoxId: number | null;
  };

  // Actions
  fetchInitialData: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  setMappingMode: (enabled: boolean, boxId?: number) => Promise<void>;
  bindPillbox: (boxId: number, row: number, col: number) => Promise<void>;
  triggerAction: (boxId: number, action: 'open' | 'blink' | 'alarm') => Promise<void>;
  
  // WebSocket Integration
  handleWsMessage: (message: WsMessage) => void;
  initialize: (useMockData?: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  reminders: [],
  pillboxes: [],
  hubStatus: null,
  isLoading: false,
  error: null,
  mappingMode: { enabled: false, blinkingBoxId: null },

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [reminders, status] = await Promise.all([
        api.getReminders(),
        api.getSystemStatus(),
      ]);
      set({ 
        reminders, 
        pillboxes: status.pillboxes, 
        hubStatus: status.hub, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      set({ error: 'Failed to load system data', isLoading: false });
    }
  },

  addReminder: async (reminder) => {
    try {
      const newReminder = await api.addReminder(reminder);
      set((state) => ({ reminders: [...state.reminders, newReminder] }));
    } catch (error) {
      console.error('Failed to add reminder:', error);
      // set({ error: 'Failed to add reminder' }); // Optional: Set error state
    }
  },

  updateReminder: async (id, updates) => {
    try {
      const updatedReminder = await api.updateReminder(id, updates);
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? updatedReminder : r)),
      }));
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  },

  deleteReminder: async (id) => {
    try {
      await api.deleteReminder(id);
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  },

  setMappingMode: async (enabled, boxId) => {
    try {
      // In a real scenario, you might notify the backend
      // await api.setMappingMode(enabled, boxId); 
      if (enabled && boxId) {
        get().triggerAction(boxId, 'blink');
        set({ mappingMode: { enabled: true, blinkingBoxId: boxId } });
      } else {
        set({ mappingMode: { enabled: false, blinkingBoxId: null } });
      }
    } catch (error) {
      console.error('Failed to set mapping mode:', error);
    }
  },

  bindPillbox: async (boxId, row, col) => {
    try {
      console.log(`Binding Pillbox #${boxId} to (row: ${row}, col: ${col})`);
      // --- MOCK LOGIC ---
      // In a real app, this would be an API call:
      // await api.bindPillbox(boxId, row, col);

      // Supports both initial mapping AND re-binding via drag-and-drop:
      //   - If called from mapping mode (blinkingBoxId === boxId), mapping mode
      //     is exited automatically.
      //   - If called from a drag-and-drop (mappingMode not active or targeting a
      //     different box), mappingMode state is left untouched.
      set(state => ({
        pillboxes: state.pillboxes.map(p =>
          p.id === boxId ? { ...p, row, col } : p
        ),
        // Only clear mapping mode when we were mapping this specific box
        mappingMode:
          state.mappingMode.blinkingBoxId === boxId
            ? { enabled: false, blinkingBoxId: null }
            : state.mappingMode,
      }));

    } catch (error) {
      console.error(`Failed to bind pillbox ${boxId}:`, error);
    }
  },

  triggerAction: async (boxId, action) => {
    try {
      await api.triggerPillboxAction(boxId, action);
    } catch (error) {
      console.error(`Failed to trigger ${action} on box ${boxId}:`, error);
    }
  },

  handleWsMessage: (message: WsMessage) => {
    switch (message.type) {
      case 'STATUS_UPDATE':
        const payload = message.payload as StatusUpdatePayload;
        set((state) => ({
          hubStatus: payload.hub || state.hubStatus,
          pillboxes: payload.pillboxes || state.pillboxes,
          // If reminders are sent via WS, update them too
          reminders: payload.reminders ? payload.reminders : state.reminders, 
        }));
        break;
      
      case 'ALARM_TRIGGERED':
        console.log('Alarm Triggered:', message.payload);
        // Could update a UI alert state here
        break;

      case 'PILL_TAKEN':
        console.log('Pill Taken:', message.payload);
        // Could update history logs here
        break;

      default:
        console.warn('Unhandled WS message:', message.type);
    }
  },

  initialize: (useMockData = false) => {
    if (useMockData) {
      console.warn("Using mock data for development.");
      const { pillboxes, hubStatus } = generateMockData();
      set({ pillboxes, hubStatus, isLoading: false });
      return;
    }

    // 1. Fetch HTTP Data
    get().fetchInitialData();

    // 2. Connect WebSocket
    wsService.connect();

    // 3. Subscribe to WS messages
    wsService.subscribe('STATUS_UPDATE', (msg) => get().handleWsMessage(msg));
    wsService.subscribe('ALARM_TRIGGERED', (msg) => get().handleWsMessage(msg));
    wsService.subscribe('PILL_TAKEN', (msg) => get().handleWsMessage(msg));
  }
}));
