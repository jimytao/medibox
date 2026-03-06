import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import Grid from '../components/Grid';
import PillboxCard from '../components/PillboxCard';
import ReminderForm from '../components/ReminderForm';
import { Plus, Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { 
    hubStatus, 
    pillboxes, 
    triggerAction, 
    addReminder, 
    isLoading, 
    error,
    mappingMode,
    setMappingMode,
    initialize,
  } = useStore();

  useEffect(() => {
    // Initialize store, use mock data by passing true
    initialize(true);
  }, [initialize]);


  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<number | undefined>(undefined);

  const handleOpenReminder = (boxId?: number) => {
    setSelectedBoxId(boxId);
    setIsReminderModalOpen(true);
  };

  const handleCloseReminder = () => {
    setIsReminderModalOpen(false);
    setSelectedBoxId(undefined);
  };

  const handleBlink = (id: number) => {
    triggerAction(id, 'blink');
  };
  
  const handleMapToggle = (id: number) => {
    // If we are turning on mapping for a box, or switching to another box
    if (!mappingMode.enabled || mappingMode.blinkingBoxId !== id) {
      setMappingMode(true, id);
    } else {
      // If we are turning off mapping for the currently blinking box
      setMappingMode(false);
    }
  };


  if (isLoading && !hubStatus) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const connectedCount = pillboxes.filter(p => p.isConnected).length;
  const availableBoxIds = pillboxes.map(p => p.id);

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Hub Status</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {hubStatus ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className={`p-3 rounded-full ${hubStatus ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {hubStatus ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Connected Modules</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{connectedCount} / {pillboxes.length}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
             onClick={() => handleOpenReminder()}>
          <div>
            <p className="text-sm font-medium text-gray-500">Quick Actions</p>
            <p className="text-lg font-semibold text-blue-600 mt-1 flex items-center gap-2">
              <Plus size={18} /> New Reminder
            </p>
          </div>
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Plus size={24} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Grid View */}
        <div className="xl:col-span-2">
          <Grid pillboxes={pillboxes} />
        </div>

        {/* Detailed Pillbox List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Pillbox Modules</h2>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {pillboxes.map((box) => (
              <PillboxCard 
                key={box.id} 
                pillbox={box} 
                onBlink={handleBlink} 
                onOpenReminder={handleOpenReminder} 
                onMap={handleMapToggle}
                isMapping={mappingMode.enabled && mappingMode.blinkingBoxId === box.id}
              />
            ))}
            {pillboxes.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No pillboxes detected. Please connect a module to the Hub.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseReminder}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <ReminderForm 
                availableBoxIds={availableBoxIds}
                boxId={selectedBoxId}
                onSubmit={async (data) => {
                  await addReminder(data);
                  handleCloseReminder();
                }}
                onCancel={handleCloseReminder}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
