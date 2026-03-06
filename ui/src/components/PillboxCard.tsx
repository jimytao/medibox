import React from 'react';
import { Pillbox } from '../types';
import { Battery, Pill, BoxSelect, Clock, RefreshCw, MapPin } from 'lucide-react';

interface PillboxCardProps {
  pillbox: Pillbox;
  onBlink: (id: number) => void;
  onOpenReminder: (id: number) => void;
  onMap: (id: number) => void;
  isMapping: boolean;
}

const PillboxCard: React.FC<PillboxCardProps> = ({ pillbox, onBlink, onOpenReminder, onMap, isMapping }) => {
  const formatLastHeartbeat = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasPosition = pillbox.row !== undefined && pillbox.col !== undefined;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all hover:shadow-lg ${
      pillbox.isConnected ? 'border-green-500' : 'border-red-500'
    } ${isMapping ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Box #{pillbox.id}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            pillbox.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {pillbox.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          {hasPosition ? `(${pillbox.row}, ${pillbox.col})` : 'Unmapped'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BoxSelect size={16} />
          <span>{pillbox.isOpen ? 'Open' : 'Closed'}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Pill size={16} />
          <span>{pillbox.hasPill ? 'Has Pills' : 'Empty'}</span>
        </div>
        <div className="col-span-2 flex items-center space-x-2 text-xs text-gray-500 mt-1">
          <Clock size={14} />
          <span>Last Seen: {formatLastHeartbeat(pillbox.lastHeartbeat)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={() => onBlink(pillbox.id)}
          className="bg-blue-50 text-blue-600 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          title="Blink LED to identify"
        >
          <RefreshCw size={14} />
          ID
        </button>
        <button
          onClick={() => onMap(pillbox.id)}
          className="bg-purple-50 text-purple-600 py-2 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
        >
          <MapPin size={14} />
          {isMapping ? 'Cancel' : 'Map'}
        </button>
        <button
          onClick={() => onOpenReminder(pillbox.id)}
          className="bg-gray-50 text-gray-600 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Alarms
        </button>
      </div>
    </div>
  );
};

export default PillboxCard;
