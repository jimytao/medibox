import React, { useState, useCallback } from 'react';
import { Pillbox } from '../types';
import { Cpu, Box } from 'lucide-react';
import { useStore } from '../store/useStore';

interface GridProps {
  pillboxes: Pillbox[];
}

const GRID_SIZE = 5; // 5x5 grid

const Grid: React.FC<GridProps> = ({ pillboxes }) => {
  const { mappingMode, bindPillbox } = useStore(state => ({
    mappingMode: state.mappingMode,
    bindPillbox: state.bindPillbox,
  }));

  // --- Drag state ---
  // draggingBoxId: which pillbox id is currently being dragged
  const [draggingBoxId, setDraggingBoxId] = useState<number | null>(null);
  // dragOverCell: "row-col" string for the cell currently under the drag cursor
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // --- Click handler (mapping mode) ---
  const handleCellClick = (row: number, col: number) => {
    if (mappingMode.enabled && mappingMode.blinkingBoxId) {
      bindPillbox(mappingMode.blinkingBoxId, row, col);
    } else {
      console.log(`Cell clicked at (${row}, ${col}), but not in mapping mode.`);
    }
  };

  // --- Drag handlers ---

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, boxId: number) => {
      setDraggingBoxId(boxId);
      e.dataTransfer.effectAllowed = 'move';
      // Store the box id as transfer data (fallback for cross-browser safety)
      e.dataTransfer.setData('text/plain', String(boxId));
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingBoxId(null);
    setDragOverCell(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, row: number, col: number, isHub: boolean) => {
      // Hub cell (0,0) must not accept drops
      if (isHub) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverCell(`${row}-${col}`);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only clear highlight when truly leaving this cell (not entering a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCell(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, row: number, col: number, isHub: boolean) => {
      e.preventDefault();
      // Hub cell must not accept drops
      if (isHub) return;

      // Prefer state variable; fall back to dataTransfer for reliability
      const boxId =
        draggingBoxId ?? parseInt(e.dataTransfer.getData('text/plain'), 10);

      if (!Number.isNaN(boxId)) {
        bindPillbox(boxId, row, col);
      }

      setDraggingBoxId(null);
      setDragOverCell(null);
    },
    [draggingBoxId, bindPillbox]
  );

  // --- Cell content renderer ---
  const renderCellContent = (row: number, col: number) => {
    // Hub is fixed at (0,0) — not draggable, not a drop target
    if (row === 0 && col === 0) {
      return (
        <div className="relative group w-full h-full">
          <div className="w-full h-full rounded-lg flex items-center justify-center shadow-md bg-blue-600 text-white">
            <Cpu size={32} />
          </div>
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
            Hub
          </div>
        </div>
      );
    }

    // Check if a pillbox is mapped to this cell
    const mappedBox = pillboxes.find(p => p.row === row && p.col === col);
    const isDraggingThis = mappedBox ? draggingBoxId === mappedBox.id : false;

    if (mappedBox) {
      return (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, mappedBox.id)}
          onDragEnd={handleDragEnd}
          className={[
            'relative group w-full h-full transition-transform transform',
            'hover:scale-110 active:scale-95',
            // Show grab cursor on pointer devices; no cursor change on touch
            'cursor-grab active:cursor-grabbing select-none',
            // Semi-transparent while dragging
            isDraggingThis ? 'opacity-50' : 'opacity-100',
          ].join(' ')}
        >
          <div
            className={[
              'w-full h-full rounded-md flex items-center justify-center shadow-sm border-2',
              mappedBox.isConnected
                ? 'bg-white border-blue-400 text-blue-600'
                : 'bg-gray-100 border-gray-300 text-gray-400',
              mappedBox.isOpen ? 'ring-2 ring-yellow-400' : '',
            ].join(' ')}
          >
            <Box size={24} />
          </div>

          {/* Pillbox ID label */}
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-600">
            #{mappedBox.id}
          </div>

          {/* Pill indicator dot */}
          {mappedBox.hasPill && (
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white"
              title="Has Pills"
            />
          )}

          {/*
            Drag hint tooltip — visible on hover only on pointer devices.
            Hidden on touch devices via the @media(hover:none) modifier.
            Requires Tailwind v3 with the `hover` variant properly configured
            (default setup supports this).
          */}
          <div className="absolute inset-0 flex items-end justify-center pb-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:none)]:!hidden">
            <span className="text-[9px] leading-none text-gray-400 tracking-tight">drag</span>
          </div>
        </div>
      );
    }

    // Empty cell — no content (clickable border is handled by the outer div)
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">System Grid</h2>
      <div className="aspect-square w-full max-w-lg mx-auto p-2">
        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-full w-full">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;
            const isHubLocation = row === 0 && col === 0;
            const cellKey = `${row}-${col}`;

            const isClickable = mappingMode.enabled && !isHubLocation;
            const isDragOver = dragOverCell === cellKey;
            const hasMappedBox = pillboxes.some(p => p.row === row && p.col === col);

            // Determine cell border/background based on current interaction state
            let cellStyle: string;
            if (isHubLocation) {
              cellStyle = '!bg-transparent !border-none';
            } else if (isClickable) {
              cellStyle = 'border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer';
            } else if (isDragOver && hasMappedBox) {
              // Dropping onto an occupied cell — swap hint (orange)
              cellStyle = 'border-solid border-2 border-orange-400 bg-orange-50';
            } else if (isDragOver) {
              // Dropping onto an empty cell — valid target (blue)
              cellStyle = 'border-solid border-2 border-blue-400 bg-blue-50';
            } else {
              cellStyle = 'border-gray-200 bg-gray-50';
            }

            return (
              <div
                key={cellKey}
                onClick={() => isClickable && handleCellClick(row, col)}
                onDragOver={(e) => handleDragOver(e, row, col, isHubLocation)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, row, col, isHubLocation)}
                className={`relative aspect-square flex items-center justify-center rounded-lg border-2 transition-colors duration-150 ${cellStyle}`}
                style={{ gridRow: row + 1, gridColumn: col + 1 }}
              >
                {renderCellContent(row, col)}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        {mappingMode.enabled
          ? `Mapping Pillbox #${mappingMode.blinkingBoxId}. Click a cell to assign its position.`
          : 'Drag pillbox icons to rearrange. Use "Blink to Identify" to map new modules.'}
      </p>
    </div>
  );
};

export default Grid;
