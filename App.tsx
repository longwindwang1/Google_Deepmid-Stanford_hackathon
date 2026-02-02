import React, { useState } from 'react';
import { Flame, Activity, ChevronRight, AlertCircle, LayoutDashboard, Siren, Play, Search, CheckCircle2 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { InteractiveFloorPlan } from './components/InteractiveFloorPlan';
import { RoomList } from './components/RoomList';
import { ReportDisplay } from './components/ReportDisplay';
import { ActionModal } from './components/ActionModal';
import { FileData, RoomData, AppStatus, RoomAnalysisResponse, EmergencyResponse, StorageOptimizationResponse, FireSimulationResponse, StorageRecommendation } from './types';
import { analyzeFacility, analyzeSpecificRoom, generateEmergencyPlan, generateStorageOptimization, simulateFireSpread, findSafeStorage, detectRooms } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'analysis' | 'emergency' | 'optimization' | 'simulation'>('analysis');
  const [modalData, setModalData] = useState<RoomAnalysisResponse | EmergencyResponse | StorageOptimizationResponse | FireSimulationResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeRoomName, setActiveRoomName] = useState('');
  
  // Specific Fire Locations for Simulation Visualization
  const [simulationFireLocs, setSimulationFireLocs] = useState<{ x: number; y: number; name: string }[]>([]);

  // Simulation Mode State
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [selectedFireRoomIds, setSelectedFireRoomIds] = useState<string[]>([]);

  // Safe Storage Search State
  const [isFindingStorage, setIsFindingStorage] = useState(false);
  const [storageRecommendation, setStorageRecommendation] = useState<StorageRecommendation | null>(null);

  // Auto Detect State
  const [isDetectingRooms, setIsDetectingRooms] = useState(false);

  const handleAnalyze = async () => {
    if (!fileData) {
      setErrorMessage("Please upload a floor plan image first.");
      return;
    }
    if (rooms.length === 0) {
      setErrorMessage("Please add at least one room/zone with inventory.");
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorMessage(null);

    try {
      const result = await analyzeFacility(fileData.base64, fileData.mimeType, rooms);
      setReportMarkdown(result);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      setErrorMessage("Analysis failed. Please check your network or API key.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setReportMarkdown("");
  };

  const handleAutoDetectRooms = async () => {
    if (!fileData) return;
    setIsDetectingRooms(true);
    setErrorMessage(null);
    try {
      const detectedRooms = await detectRooms(fileData.base64, fileData.mimeType);
      // Merge with existing rooms or replace? Let's append to avoid data loss, but check for duplicates might be hard.
      // For simplicity, we just add them.
      setRooms(prev => [...prev, ...detectedRooms]);
    } catch (e) {
      setErrorMessage("Failed to auto-detect rooms. Please try adding them manually.");
    } finally {
      setIsDetectingRooms(false);
    }
  };

  // Specific Room Actions
  const handleRoomAnalysis = async (room: RoomData) => {
    if (!fileData) {
      setErrorMessage("Please upload a floor plan first.");
      return;
    }
    setErrorMessage(null);
    setModalType('analysis');
    setActiveRoomName(room.name);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const data = await analyzeSpecificRoom(fileData.base64, fileData.mimeType, room);
      setModalData(data);
    } catch (e) {
      setErrorMessage("Failed to analyze room.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleReportFire = async (room: RoomData) => {
    if (!fileData) {
      setErrorMessage("Please upload a floor plan first.");
      return;
    }
    setErrorMessage(null);
    setModalType('emergency');
    setActiveRoomName(room.name);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const data = await generateEmergencyPlan(fileData.base64, fileData.mimeType, room);
      setModalData(data);
    } catch (e) {
      setErrorMessage("Failed to generate emergency plan.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOptimizeStorage = async () => {
    if (!fileData) {
      setErrorMessage("Please upload a floor plan first.");
      return;
    }
    if (rooms.length === 0) {
      setErrorMessage("Add zones and import manifest first to optimize layout.");
      return;
    }
    setErrorMessage(null);
    setModalType('optimization');
    setActiveRoomName('Facility Wide');
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const data = await generateStorageOptimization(fileData.base64, fileData.mimeType, rooms);
      setModalData(data);
    } catch (e) {
      setErrorMessage("Failed to generate optimization plan.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFindSafeStorage = async (itemDescription: string) => {
    if (!fileData || rooms.length === 0) {
      setErrorMessage("Upload floor plan and define zones first.");
      return;
    }
    setErrorMessage(null);
    setIsFindingStorage(true);
    setStorageRecommendation(null);

    try {
      const result = await findSafeStorage(fileData.base64, fileData.mimeType, rooms, itemDescription);
      setStorageRecommendation(result);

      // Auto-save the item to the recommended room
      if (result && result.recommended_room_id) {
        setRooms(prevRooms => prevRooms.map(room => {
          if (room.id === result.recommended_room_id) {
            // Append new item to inventory
            const currentInv = room.inventory === 'Empty' ? '' : room.inventory;
            const separator = currentInv && currentInv.trim().length > 0 ? ', ' : '';
            return { 
              ...room, 
              inventory: `${currentInv}${separator}${itemDescription}` 
            };
          }
          return room;
        }));
      }

    } catch (e) {
       setErrorMessage("Failed to find a safe zone.");
    } finally {
      setIsFindingStorage(false);
    }
  };

  // Simulation Logic
  const startSimulationSelection = () => {
    if (rooms.length === 0) {
      setErrorMessage("Add rooms before running a simulation.");
      return;
    }
    setIsSimulationMode(true);
    setSelectedFireRoomIds([]);
    setErrorMessage("Select the rooms where fire is detected, then click 'Run Simulation'.");
  };

  const toggleRoomSelection = (id: string) => {
    setSelectedFireRoomIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const cancelSimulation = () => {
    setIsSimulationMode(false);
    setSelectedFireRoomIds([]);
    setErrorMessage(null);
  };

  const executeSimulation = async () => {
    if (!fileData || selectedFireRoomIds.length === 0) {
      setErrorMessage("Select at least one room to simulate fire.");
      return;
    }

    // Calculate active fire locations for the modal overlay
    const fireLocs = rooms
      .filter(r => selectedFireRoomIds.includes(r.id) && r.coords)
      .map(r => ({ x: r.coords!.x, y: r.coords!.y, name: r.name }));
    setSimulationFireLocs(fireLocs);

    setIsSimulationMode(false);
    setErrorMessage(null);
    setModalType('simulation');
    setActiveRoomName('Multi-Zone Simulation');
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const data = await simulateFireSpread(fileData.base64, fileData.mimeType, rooms, selectedFireRoomIds);
      setModalData(data);
    } catch (e) {
      setErrorMessage("Simulation failed.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
      setSelectedFireRoomIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      
      <ActionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        data={modalData}
        roomName={activeRoomName}
        loading={modalLoading}
        fileData={fileData}
        activeFireLocations={simulationFireLocs}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-safety-600 p-2 rounded-lg text-white">
              <Flame size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">FireSmart AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className={status === AppStatus.IDLE ? "text-safety-600" : ""}>1. Input Data</span>
            <ChevronRight size={16} className="text-slate-300" />
            <span className={status === AppStatus.ANALYZING ? "text-safety-600" : ""}>2. Analysis</span>
            <ChevronRight size={16} className="text-slate-300" />
            <span className={status === AppStatus.SUCCESS ? "text-safety-600" : ""}>3. Action Plan</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse shadow-sm">
            <AlertCircle size={20} />
            <p>{errorMessage}</p>
          </div>
        )}

        {status === AppStatus.SUCCESS ? (
          <ReportDisplay markdown={reportMarkdown} onReset={handleReset} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Visual Input */}
            <div className="lg:col-span-8 space-y-6">
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Facility Map
                </h2>
                
                {fileData ? (
                  <InteractiveFloorPlan 
                    fileData={fileData} 
                    rooms={rooms} 
                    setRooms={setRooms}
                    onRemoveImage={() => setFileData(null)} 
                    recommendation={storageRecommendation}
                    onAutoDetect={handleAutoDetectRooms}
                    isDetecting={isDetectingRooms}
                  />
                ) : (
                  <FileUpload selectedFile={fileData} onFileSelect={setFileData} />
                )}
              </section>

              {/* Instructions Panel */}
              {!isSimulationMode ? (
                storageRecommendation ? (
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 text-sm animate-in fade-in slide-in-from-top-4">
                       <h4 className="font-bold mb-2 flex items-center gap-2 text-indigo-900 text-lg">
                          <CheckCircle2 size={24} className="text-indigo-600" /> 
                          Recommended Zone: {storageRecommendation.room_name}
                       </h4>
                       <p className="text-indigo-800 font-medium mb-3">{storageRecommendation.reasoning}</p>
                       <div className="bg-white p-3 rounded-lg border border-indigo-100 text-slate-600 text-xs italic">
                         <span className="font-bold text-indigo-700 not-italic">Safety Tips: </span>
                         {storageRecommendation.safety_tips}
                       </div>
                    </div>
                ) : (
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-sm text-blue-800">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Activity size={16} /> How it works
                    </h4>
                    <p className="mb-2">1. Upload a floor plan. Click <strong>Auto-Detect Zones</strong> or click manually to add zones.</p>
                    <p className="mb-2">2. Use <strong>Find Safe Zone</strong> to locate the best spot for new incoming materials.</p>
                    <p>3. Use <strong>Smart Storage Plan</strong> to optimize the entire facility at once.</p>
                  </div>
                )
              ) : (
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 text-sm text-orange-900 animate-in fade-in">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Siren size={16} className="text-red-500" /> Simulation Mode Active
                  </h4>
                  <p>Select one or more rooms from the list on the right to mark them as <strong>ACTIVE FIRE SOURCES</strong>.</p>
                  <p className="mt-2">The AI will calculate the propagation path and explosion risks.</p>
                </div>
              )}
            </div>

            {/* Right Column: Text Input / Summary */}
            <div className="lg:col-span-4 space-y-6">
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Inventory List
                </h2>
                <RoomList 
                  rooms={rooms} 
                  setRooms={setRooms} 
                  onAnalyzeRoom={handleRoomAnalysis}
                  onReportFire={handleReportFire}
                  selectionMode={isSimulationMode}
                  selectedIds={selectedFireRoomIds}
                  onToggleSelect={toggleRoomSelection}
                  onFindSafeStorage={handleFindSafeStorage}
                  isFindingStorage={isFindingStorage}
                />
              </section>

              {/* Action Area */}
              <div className="pt-4 border-t border-slate-200 sticky bottom-4 bg-slate-50 space-y-3 z-30 p-2 rounded-xl border">
                 {status === AppStatus.ANALYZING ? (
                    <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-xl flex items-center justify-center gap-3 cursor-wait">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                      Analyzing...
                    </button>
                 ) : isSimulationMode ? (
                    <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                      <button 
                        onClick={cancelSimulation}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={executeSimulation}
                        disabled={selectedFireRoomIds.length === 0}
                        className="flex-[2] bg-red-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Play size={18} fill="currentColor" /> Run Simulation
                      </button>
                    </div>
                 ) : (
                    <>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleOptimizeStorage}
                          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                        >
                          <LayoutDashboard size={18} />
                          Smart Storage Plan
                        </button>
                        <button 
                          onClick={startSimulationSelection}
                          className="flex-1 bg-white border border-slate-200 text-red-700 hover:bg-red-50 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                        >
                          <Siren size={18} />
                          Simulate
                        </button>
                      </div>
                      <button 
                        onClick={handleAnalyze}
                        className="w-full bg-gradient-to-r from-safety-600 to-safety-700 hover:from-safety-500 hover:to-safety-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-safety-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-lg"
                      >
                        <Flame size={24} fill="currentColor" />
                        Generate Full Report
                      </button>
                    </>
                 )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;