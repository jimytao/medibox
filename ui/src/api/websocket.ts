import { WsMessage, WsMessageType, StatusUpdatePayload } from '../types';

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:81`; // Default to port 81 for ESP32

type MessageHandler = (message: WsMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<WsMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDev = import.meta.env.DEV;
  private mockInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  public connect() {
    if (this.isDev) {
      this.startMockSimulation();
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(WS_URL);
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    if (this.isDev) {
      if (this.mockInterval) clearInterval(this.mockInterval);
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public send(type: string, payload: any) {
    if (this.isDev) {
      console.log('[Mock WS] Sent:', type, payload);
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', type);
    }
  }

  public subscribe(type: WsMessageType, handler: MessageHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  private handleOpen() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.notifyListeners({
        type: 'STATUS_UPDATE',
        payload: { status: 'connected' }, // Signal connection status
        timestamp: Date.now()
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WsMessage = JSON.parse(event.data);
      this.notifyListeners(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.reason);
    this.socket = null;
    this.scheduleReconnect();
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.socket?.close();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Reconnecting in ${RECONNECT_INTERVAL}ms... (Attempt ${this.reconnectAttempts})`);
      this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_INTERVAL);
    } else {
      console.error('Max reconnect attempts reached.');
    }
  }

  private notifyListeners(message: WsMessage) {
    const handlers = this.listeners.get(message.type);
    handlers?.forEach(handler => handler(message));
  }

  // --- Mock Simulation for Dev Mode ---
  private startMockSimulation() {
    console.log('[Mock WS] Simulation started');
    if (this.mockInterval) clearInterval(this.mockInterval);

    this.mockInterval = setInterval(() => {
      const mockStatus: StatusUpdatePayload = {
        hub: {
          wifiConnected: true,
          mqttConnected: true,
          ipAddress: '192.168.1.100',
          uptime: Date.now() / 1000,
          time: new Date().toISOString()
        },
        pillboxes: [
           { id: 1, isConnected: true, hasPill: Math.random() > 0.5, isOpen: false, lastHeartbeat: Date.now() },
           { id: 2, isConnected: true, hasPill: true, isOpen: Math.random() > 0.8, lastHeartbeat: Date.now() }
        ]
      };

      this.notifyListeners({
        type: 'STATUS_UPDATE',
        payload: mockStatus,
        timestamp: Date.now()
      });
    }, 5000); // Send status update every 5 seconds
  }
}

export const wsService = new WebSocketService();
