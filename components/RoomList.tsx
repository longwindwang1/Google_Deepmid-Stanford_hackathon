import React, { useState } from 'react';
import { Plus, Trash2, Box, AlertTriangle, MapPin, Microscope, Flame, CheckSquare, Square, FileText, ArrowRight, Search } from 'lucide-react';
import { RoomData } from '../types';

interface RoomListProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  onAnalyzeRoom?: (room: RoomData) => void;
  onReportFire?: (room: RoomData) => void;
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onFindSafeStorage?: (item: string) => void;
  isFindingStorage?: boolean;
}

export const RoomList: React.FC<RoomListProps> = ({ 
  rooms, 
  setRooms, 
  onAnalyzeRoom, 
  onReportFire,
  selectionMode = false,
  selectedIds = [],
  onToggleSelect,
  onFindSafeStorage,
  isFindingStorage = false
}) => {
  const [newItemQuery, setNewItemQuery] = useState('');

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const handleFindStorage = () => {
    if (newItemQuery.trim() && onFindSafeStorage) {
      onFindSafeStorage(newItemQuery);
      setNewItemQuery('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Safe Storage Locator */}
      {!selectionMode && onFindSafeStorage && (
        <div className="bg-indigo-600 text-white rounded-xl overflow-hidden shadow-lg transform transition-all hover:scale-[1.01]">
           <div className="p-4">
             <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
               <Search size={16} className="text-indigo-200" /> Find Safe Zone for Item
             </h4>
             <div className="flex gap-2">
               <input 
                 type="text"
                 value={newItemQuery}
                 onChange={(e) => setNewItemQuery(e.target.value)}
                 placeholder="e.g. 50kg Calcium Carbide"
                 className="flex-1 bg-indigo-700/50 border border-indigo-400/30 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                 onKeyDown={(e) => e.key === 'Enter' && handleFindStorage()}
               />
               <button 
                 onClick={handleFindStorage}
                 disabled={isFindingStorage || !newItemQuery.trim()}
                 className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {isFindingStorage ? "..." : "Locate"}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* 2. List of Added Rooms */}
      <div className="space-y-3">
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            No zones added yet. Click the map to tag a room or use Auto-Detect.
          </div>
        ) : (
          rooms.map((room) => {
            const isSelected = selectedIds.includes(room.id);
            return (
              <div 
                key={room.id} 
                className={`bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn group
                  ${selectionMode ? (isSelected ? 'border-red-500 bg-red-50 ring-1 ring-red-500 cursor-pointer' : 'border-slate-200 cursor-pointer hover:border-red-300') : 'border-slate-200'}
                  ${room.name.includes("INCOMING") ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}
                `}
                onClick={() => selectionMode && onToggleSelect?.(room.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {selectionMode && (
                    <div className={`shrink-0 ${isSelected ? 'text-red-600' : 'text-slate-300'}`}>
                      {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${isSelected ? 'text-red-900' : 'text-slate-800'}`}>{room.name}</span>
                      {room.name.includes("INCOMING") ? (
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Staging</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Zone</span>
                      )}
                      
                      {room.coords && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          <MapPin size={10} /> Mapped
                        </span>
                      )}
                    </div>
                    <div className={`flex items-start gap-2 text-sm ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>
                      <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'text-red-600' : 'text-orange-500'}`} />
                      <p className="line-clamp-2">{room.inventory}</p>
                    </div>
                  </div>
                </div>
                
                {!selectionMode && (
                  <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-3 mt-2 md:mt-0 justify-end w-full md:w-auto">
                    {onAnalyzeRoom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAnalyzeRoom(room); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Analyze Safety"
                      >
                        <Microscope size={18} />
                      </button>
                    )}
                    {onReportFire && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReportFire(room); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="REPORT FIRE"
                      >
                        <Flame size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRoom(room.id); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Remove Zone"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};