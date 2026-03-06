export interface Reminder {
  id: string;
  time: string; // HH:MM format
  days: number[]; // 0-6, where 0 is Sunday
  enabled: boolean;
  boxId: number; // ID of the specific pillbox compartment/module
  label?: string;
}

export interface Pillbox {
  id: number;
  row?: number;
  col?: number;
  isConnected: boolean;
  hasPill: boolean; // Detection status
  isOpen: boolean;  // Lid status
  lastHeartbeat: number;
}

export interface HubStatus {
  wifiConnected: boolean;
  mqttConnected: boolean;
  ipAddress: string;
  uptime: number;
  time: string; // ISO string
}

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

// WebSocket Message Types
export type WsMessageType = 
  | 'STATUS_UPDATE' 
  | 'ALARM_TRIGGERED' 
  | 'PILL_TAKEN' 
  | 'CONFIG_UPDATED'
  | 'ERROR';

export interface WsMessage<T = any> {
  type: WsMessageType;
  payload: T;
  timestamp: number;
}

export interface StatusUpdatePayload {
  hub: HubStatus;
  pillboxes: Pillbox[];
  reminders?: Reminder[]; // Optional full sync
}
