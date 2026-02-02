import React, { useState, useRef } from 'react';
import { Plus, X, MapPin, CheckCircle2, ScanSearch, Pencil } from 'lucide-react';
import { RoomData, FileData, StorageRecommendation } from '../types';

interface InteractiveFloorPlanProps {
  fileData: FileData;
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  onRemoveImage: () => void;
  recommendation?: StorageRecommendation | null;
  onAutoDetect?: () => Promise<void>;
  isDetecting?: boolean;
}

export const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({ 
  fileData, 
  rooms, 
  setRooms, 
  onRemoveImage,
  recommendation,
  onAutoDetect,
  isDetecting = false
}) => {
  const [tempCoords, setTempCoords] = useState<{x: number, y: number} | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newInventory, setNewInventory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || isFormOpen) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempCoords({ x, y });
    setEditingRoomId(null);
    setNewRoomName('');
    setNewInventory('');
    setIsFormOpen(true);
  };

  const handlePinClick = (room: RoomData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!room.coords) return;
    
    setTempCoords(room.coords);
    setEditingRoomId(room.id);
    setNewRoomName(room.name);
    setNewInventory(room.inventory);
    setIsFormOpen(true);
  };

  const handleSaveRoom = () => {
    if (!newRoomName.trim() || !tempCoords) return;

    if (editingRoomId) {
      // Update existing
      setRooms(prev => prev.map(r => 
        r.id === editingRoomId 
          ? { ...r, name: newRoomName, inventory: newInventory || 'General Storage', coords: tempCoords } 
          : r
      ));
    } else {
      // Create new
      const newRoom: RoomData = {
        id: Date.now().toString(),
        name: newRoomName,
        inventory: newInventory || 'General Storage',
        coords: tempCoords
      };
      setRooms([...rooms, newRoom]);
    }

    setIsFormOpen(false);
    setTempCoords(null);
    setEditingRoomId(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setTempCoords(null);
    setEditingRoomId(null);
  };

  const handleRemoveRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms(rooms.filter(r => r.id !== id));
    if (editingRoomId === id) {
      setIsFormOpen(false);
    }
  };

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 select-none group">
      
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-2">
            Click map to add pin <span className="text-slate-400">|</span> Click pin to edit
          </span>
          {onAutoDetect && (
             <button 
               onClick={onAutoDetect}
               disabled={isDetecting}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1 rounded shadow-md flex items-center gap-1 transition-colors"
             >
               {isDetecting ? <span className="animate-spin">⏳</span> : <ScanSearch size={14} />}
               {isDetecting ? 'Detecting...' : 'Auto-Detect Zones'}
             </button>
          )}
        </div>
        <button 
          onClick={onRemoveImage}
          className="bg-white/10 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-md transition-colors pointer-events-auto"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Container */}
      <div 
        className="relative cursor-crosshair"
        onClick={handleImageClick}
      >
        <img 
          ref={imageRef}
          src={fileData.previewUrl} 
          alt="Floor Plan" 
          className="w-full h-auto block object-contain max-h-[70vh]"
        />

        {/* Existing Room Pins */}
        {rooms.map((room) => {
          const isRecommended = recommendation?.recommended_room_id === room.id;
          const isEditing = editingRoomId === room.id;
          
          return room.coords && (
          <div 
            key={room.id}
            className={`absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-full z-10 hover:z-30 transition-all duration-300 cursor-pointer
              ${isRecommended ? 'z-40 scale-125' : ''} 
              ${isEditing ? 'z-50 scale-110' : ''}`}
            style={{ left: `${room.coords.x}%`, top: `${room.coords.y}%` }}
            onClick={(e) => handlePinClick(room, e)} 
          >
            {/* Tooltip (Name) */}
            <div className={`mb-1 transition-opacity text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none border
              ${isRecommended 
                  ? 'opacity-100 bg-indigo-900 border-indigo-400' 
                  : isEditing 
                    ? 'opacity-100 bg-emerald-700 border-emerald-400'
                    : 'bg-slate-800 border-slate-600 opacity-90 group-hover:opacity-100'}
            `}>
              <div className="font-bold text-sm flex items-center gap-1">
                 {room.name}
                 {isEditing && <Pencil size={10} />}
              </div>
              {isRecommended && (
                 <div className="text-indigo-200 font-bold flex items-center gap-1 mt-1 text-[10px]">
                   <CheckCircle2 size={10} /> Recommended
                 </div>
              )}
            </div>
            
            {/* Pin Icon */}
            <div className="relative group/pin">
              {isRecommended && (
                <div className="absolute -inset-4 bg-indigo-500/40 rounded-full animate-ping pointer-events-none" />
              )}
              <MapPin 
                className={`drop-shadow-md transition-colors 
                  ${isRecommended ? 'text-indigo-500 fill-indigo-500' : ''}
                  ${isEditing ? 'text-emerald-500 fill-emerald-500' : ''}
                  ${!isRecommended && !isEditing ? 'text-safety-500 fill-safety-500 hover:text-emerald-400' : ''}
                `} 
                size={isRecommended ? 40 : 32} 
              />
              {!isRecommended && !isEditing && (
                <button 
                  onClick={(e) => handleRemoveRoom(room.id, e)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover/pin:opacity-100 transition-opacity scale-75 hover:bg-red-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )})}

        {/* Temporary Pin (Adding mode) */}
        {tempCoords && isFormOpen && !editingRoomId && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full z-20"
            style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
          >
             <MapPin className="text-blue-500 fill-blue-500 animate-bounce" size={32} />
          </div>
        )}

        {/* Floating Form Overlay */}
        {isFormOpen && tempCoords && (
          <div 
            className="absolute z-30 bg-white p-4 rounded-lg shadow-2xl border border-slate-200 w-64 animate-in fade-in zoom-in duration-200"
            style={{ 
              left: `Math.min(${tempCoords.x}%, 80%)`, 
              top: `Math.min(${tempCoords.y}%, 80%)` 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
               {editingRoomId ? 'Edit Zone Details' : 'Add Location Details'}
               <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Room Name / Number</label>
                <input
                  autoFocus
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-safety-500 outline-none"
                  placeholder="e.g. Room 101"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Items / Inventory</label>
                <input
                  type="text"
                  value={newInventory}
                  onChange={(e) => setNewInventory(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-safety-500 outline-none"
                  placeholder="e.g. Empty, Solvents"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRoom()}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleSaveRoom}
                  className="flex-1 bg-safety-600 text-white py-1.5 rounded text-xs font-bold hover:bg-safety-700"
                >
                  {editingRoomId ? 'Update' : 'Save Pin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};