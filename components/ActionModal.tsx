import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Flame, Info, CheckCircle2, Ban, Footprints, Droplets, ArrowRight, LayoutDashboard, Siren, Clock, Activity, MapPin, AlertOctagon, DoorOpen, ListChecks } from 'lucide-react';
import { RoomAnalysisResponse, EmergencyResponse, StorageOptimizationResponse, FireSimulationResponse, FileData } from '../types';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'analysis' | 'emergency' | 'optimization' | 'simulation';
  data: RoomAnalysisResponse | EmergencyResponse | StorageOptimizationResponse | FireSimulationResponse | null;
  roomName: string;
  loading: boolean;
  fileData?: FileData | null;
  activeFireLocations?: { x: number; y: number; name: string }[];
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, type, data, roomName, loading, fileData, activeFireLocations }) => {
  const [optTab, setOptTab] = useState<'moves' | 'layout'>('moves');

  if (!isOpen) return null;

  const getHeaderColor = () => {
    switch (type) {
      case 'emergency': return 'bg-red-50 border-red-100';
      case 'simulation': return 'bg-orange-50 border-orange-100';
      case 'optimization': return 'bg-indigo-50 border-indigo-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-600';
      case 'simulation': return 'bg-orange-100 text-orange-600';
      case 'optimization': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'emergency': return <Flame size={24} />;
      case 'simulation': return <Siren size={24} />;
      case 'optimization': return <LayoutDashboard size={24} />;
      default: return <ShieldCheck size={24} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'emergency': return 'Emergency Protocol';
      case 'simulation': return 'Fire Propagation Simulation';
      case 'optimization': return 'Storage Plan & Optimization';
      default: return 'Detailed Safety Analysis';
    }
  };

  const safeUpper = (str: any) => (typeof str === 'string' ? str.toUpperCase() : String(str || '').toUpperCase());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${getHeaderColor()}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${getIconColor()}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {getTitle()}
              </h3>
              <p className="text-sm text-slate-500">
                {type === 'optimization' ? 'Facility-Wide Assessment' : 
                 type === 'simulation' ? 'Multi-Zone Event Simulation' : 
                 `Target Zone: ${roomName}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin 
                ${type === 'emergency' || type === 'simulation' ? 'border-red-500' : 
                  type === 'optimization' ? 'border-indigo-500' : 'border-blue-500'}`} />
              <p className="text-slate-500 font-medium">Running advanced simulation with Gemini...</p>
            </div>
          ) : data ? (
            <>
            {/* ================== FIRE SIMULATION ================== */}
            {type === 'simulation' && (
              <div className="space-y-6">
                {(() => {
                  const d = data as FireSimulationResponse;
                  return (
                    <>
                      <div className="bg-orange-600 text-white p-5 rounded-xl shadow-md border-l-8 border-orange-800">
                         <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                           <Flame size={24} className="animate-pulse" /> Active Fire Zones
                         </h4>
                         <div className="flex flex-wrap gap-2">
                           {(d.primary_fire_zones || []).map((zone, i) => (
                             <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                               {zone}
                             </span>
                           ))}
                         </div>
                      </div>

                      {fileData && (
                        <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-md">
                          <img 
                            src={fileData.previewUrl} 
                            alt="Map Route" 
                            className="w-full h-auto max-h-[60vh] object-contain opacity-60 block" 
                          />
                          
                          {d.route_coordinates && d.route_coordinates.length > 0 && (
                            <svg 
                              className="absolute inset-0 w-full h-full pointer-events-none" 
                              viewBox="0 0 100 100" 
                              preserveAspectRatio="none"
                            >
                              <polyline
                                points={d.route_coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="white"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeOpacity="0.8"
                                vectorEffect="non-scaling-stroke"
                              />
                              <polyline
                                points={d.route_coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeDasharray="12,12"
                                strokeLinecap="round"
                                className="animate-pulse"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          )}

                          {d.route_coordinates && d.route_coordinates.length > 0 && (
                             <div 
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                                style={{ left: `${d.route_coordinates[0].x}%`, top: `${d.route_coordinates[0].y}%` }}
                             >
                                <div className="flex flex-col items-center">
                                  <div className="bg-green-600 text-white p-1.5 rounded-md shadow-lg border-2 border-white animate-bounce">
                                    <DoorOpen size={24} />
                                  </div>
                                  <span className="bg-black/80 text-white text-xs px-2 py-1 rounded mt-1 font-bold uppercase shadow-sm border border-white/20">Entry</span>
                                </div>
                             </div>
                          )}

                          {activeFireLocations?.map((loc, i) => (
                            <div 
                              key={`fire-${i}`}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                            >
                               <div className="relative flex flex-col items-center">
                                 <div className="absolute -inset-6 bg-red-500/30 rounded-full animate-ping"></div>
                                 <Flame className="text-red-600 fill-orange-500 drop-shadow-xl z-10" size={56} />
                                 <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 font-bold border border-white z-20 whitespace-nowrap shadow-md">
                                   {loc.name}
                                 </span>
                               </div>
                            </div>
                          ))}

                          {(d.tactical_markers || []).map((marker, i) => (
                            <div 
                              key={`tactical-${i}`}
                              className="absolute transform -translate-x-1/2 -translate-y-full group cursor-pointer z-20 hover:z-40"
                              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                            >
                              <div className="relative hover:scale-110 transition-transform">
                                <MapPin 
                                  size={40} 
                                  className={`drop-shadow-xl ${marker.type === 'DANGER' ? 'text-red-600 fill-red-600 animate-bounce' : 'text-yellow-400 fill-yellow-400'}`} 
                                />
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm border border-white/10">
                                <div className={`font-bold mb-1 uppercase flex items-center gap-1.5 text-sm ${marker.type === 'DANGER' ? 'text-red-400' : 'text-yellow-400'}`}>
                                  {marker.type === 'DANGER' ? 'Danger Zone' : 'Caution'}
                                </div>
                                <div className="font-bold text-sm text-white mb-2">{marker.label}</div>
                                <div className="text-slate-300 italic border-t border-slate-700 pt-2 leading-relaxed">{marker.action_protocol}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                         <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                           <Footprints size={20} className="text-blue-600" /> Route Analysis
                         </h5>
                         <div className="flex flex-col gap-4">
                           <div>
                               <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Suggested Entry</span>
                               <p className="font-bold text-lg text-slate-800">{d.firefighter_entry_route?.entry_point}</p>
                           </div>
                           <div className="bg-white p-4 rounded-lg border border-slate-200">
                             <p className="text-slate-700 leading-relaxed font-medium">{d.firefighter_entry_route?.path_description}</p>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {(d.firefighter_entry_route?.hazards_on_path || []).map((h, i) => (
                               <span key={i} className="bg-red-50 text-red-700 border border-red-100 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                                 <AlertTriangle size={12} /> {h}
                               </span>
                             ))}
                             <span className="px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                               <Activity size={12} /> RISK: {d.firefighter_entry_route?.estimated_risk}
                             </span>
                           </div>
                         </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Siren size={20} className="text-red-500" /> Propagation Forecast
                        </h5>
                        <div className="grid gap-3">
                          {(d.fire_propagation_analysis || []).map((room, i) => (
                            <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <h6 className="font-bold text-slate-800">{room.room_name}</h6>
                                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-yellow-100 text-yellow-700">
                                    {room.impact_type}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{room.reason}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                  <Clock size={14} /> Est. Impact: <span className="text-slate-900">{room.time_to_impact_estimate}</span>
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ================== EMERGENCY ================== */}
            {type === 'emergency' && (
              <div className="space-y-6">
                 {(() => {
                    const d = data as EmergencyResponse;
                    return (
                      <>
                        <div className="bg-red-600 text-white p-5 rounded-xl shadow-md border-l-8 border-red-800">
                          <h4 className="font-bold text-2xl mb-2 flex items-center gap-2">
                             <AlertTriangle size={28} /> {d.incident_summary}
                          </h4>
                          <p className="text-red-100 text-sm">Room ID: {d.room_id} • Status: ACTIVE INCIDENT</p>
                        </div>

                        <div>
                          <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase text-sm tracking-wider">
                            <Flame size={16} className="text-orange-500" /> Primary Hazards
                          </h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            {(d.primary_hazards || []).map((h, i) => (
                              <div key={i} className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-orange-900 block">{h.hazard_type}</span>
                                  <span className="bg-orange-200 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{h.urgency}</span>
                                </div>
                                <p className="text-sm text-orange-800">{h.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase">
                               <Droplets size={16} className="text-blue-500" /> Suppression Agents
                             </h5>
                             <div className="mb-3">
                               <div className="flex flex-wrap gap-2">
                                 {(d.extinguishing_agents?.recommended || []).map((agent, i) => (
                                   <span key={i} className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded font-medium border border-green-200">{agent}</span>
                                 ))}
                               </div>
                             </div>
                             <div className="mb-3">
                               <div className="flex flex-wrap gap-2">
                                 {(d.extinguishing_agents?.prohibited || []).map((agent, i) => (
                                   <span key={i} className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded font-medium border border-red-200 line-through decoration-red-500">{agent}</span>
                                 ))}
                               </div>
                             </div>
                             <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">{d.extinguishing_agents?.details}</p>
                           </div>

                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase">
                                <ShieldCheck size={16} className="text-indigo-500" /> Required PPE
                              </h5>
                              <ul className="space-y-2 mb-4">
                                {(d.firefighter_ppe || []).map((item, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">{d.containment_strategy}</p>
                           </div>
                        </div>
                      </>
                    );
                 })()}
              </div>
            )}
            
            {/* ================== OPTIMIZATION ================== */}
            {type === 'optimization' && (
              <div className="space-y-6">
                {(() => {
                  const d = data as StorageOptimizationResponse;
                  const isSafe = d.safety_status === 'SAFE';
                  const isCritical = d.safety_status === 'CRITICAL';
                  
                  return (
                    <>
                      <div className={`p-5 rounded-xl border ${isSafe ? 'bg-green-50 border-green-200' : isCritical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`text-lg font-bold ${isSafe ? 'text-green-900' : isCritical ? 'text-red-900' : 'text-yellow-900'}`}>
                            Status: {d.safety_status}
                          </h4>
                        </div>
                        <p className={`text-sm ${isSafe ? 'text-green-800' : isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                          {d.safety_assessment}
                        </p>
                      </div>

                      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button 
                          onClick={() => setOptTab('moves')}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${optTab === 'moves' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                        >
                          Moves
                        </button>
                        <button 
                          onClick={() => setOptTab('layout')}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${optTab === 'layout' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                        >
                          Layout
                        </button>
                      </div>

                      {optTab === 'moves' && (
                        (d.relocation_plan || []).map((plan, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between gap-4">
                              <div className="flex-1">
                                <span className="font-bold text-slate-800">{plan.item_name}</span>
                                <p className="text-sm text-slate-500">{plan.reason}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg text-sm">
                                <span>{plan.current_room}</span>
                                <ArrowRight size={16} />
                                <span className="font-bold text-indigo-600">{plan.suggested_room}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {optTab === 'layout' && (d.recommended_zone_layouts || []).map((zone, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold">{zone.room_name}</div>
                          <div className="p-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(zone.assigned_items || []).map((item, j) => (
                                <span key={j} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2 py-1 rounded">{item}</span>
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 italic">{zone.safety_rationale}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ================== ANALYSIS ================== */}
            {type === 'analysis' && (
              <div className="space-y-6">
                {(() => {
                  const d = data as RoomAnalysisResponse;
                  const riskColor = d.risk_level === 'Critical' || d.risk_level === 'High' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700';
                  return (
                    <>
                       <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{d.report_title}</h2>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold ${riskColor}`}>
                              RISK LEVEL: {safeUpper(d.risk_level)}
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-blue-500">
                             <span className="text-2xl font-black">{d.safety_score}</span>
                             <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                          </div>
                       </div>

                       <div>
                          <h5 className="font-bold text-slate-800 mb-3 border-b pb-2">Key Findings</h5>
                          <div className="space-y-3">
                            {(d.key_findings || []).map((f, i) => (
                              <div key={i} className="p-3 border rounded-lg bg-slate-50">
                                <span className="font-bold text-slate-900 block">{f.category}</span>
                                <p className="text-sm text-slate-600">{f.description}</p>
                              </div>
                            ))}
                          </div>
                       </div>

                       <div>
                          <h5 className="font-bold text-slate-800 mb-3 border-b pb-2">Recommended Actions</h5>
                          <div className="space-y-2">
                              {(d.corrective_actions || []).map((action, i) => (
                                <div key={i} className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm font-medium">
                                    {action.description}
                                </div>
                              ))}
                          </div>
                       </div>
                    </>
                  );
                })()}
              </div>
            )}
            </>
          ) : (
             <div className="text-center text-red-500 py-8">Failed to load data. Please try again.</div>
          )}
        </div>
      </div>
    </div>
  );
};