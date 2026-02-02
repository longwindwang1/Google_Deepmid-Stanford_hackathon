
export interface RoomData {
  id: string;
  name: string;
  inventory: string;
  coords?: {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
  };
}

export interface AnalysisResult {
  markdown: string;
  timestamp: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface RoomAnalysisResponse {
  report_title: string;
  room_id: string;
  safety_score: number;
  risk_level: string;
  key_findings: {
    category: string;
    description: string;
    severity: string;
  }[];
  corrective_actions: {
    action_id: string;
    description: string;
    priority: string;
    due_date_suggestion?: string;
  }[];
  additional_notes?: string;
}

export interface EmergencyResponse {
  incident_summary: string;
  room_id: string;
  primary_hazards: {
    hazard_type: string;
    details: string;
    urgency: string;
  }[];
  extinguishing_agents: {
    recommended: string[];
    prohibited: string[];
    details: string;
  };
  firefighter_ppe: string[];
  entry_exit_guidance: {
    safest_entry_point: string;
    primary_evacuation_route: string;
    special_considerations: string;
  };
  containment_strategy: string;
}

export interface StorageOptimizationResponse {
  safety_status: 'SAFE' | 'UNSAFE' | 'CRITICAL';
  safety_assessment: string;
  relocation_plan: {
    item_name: string;
    current_room: string;
    suggested_room: string;
    reason: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  recommended_zone_layouts: {
    room_id: string;
    room_name: string;
    assigned_items: string[];
    safety_rationale: string;
    compatibility_notes: string;
  }[];
  segregation_rules_applied: string[];
}

export interface FireSimulationResponse {
  simulation_id: string;
  primary_fire_zones: string[];
  firefighter_entry_route: {
    entry_point: string;
    path_description: string;
    hazards_on_path: string[];
    estimated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  route_coordinates: { x: number; y: number }[]; // Array of points 0-100%
  tactical_markers: {
    x: number;
    y: number;
    type: 'CAUTION' | 'DANGER'; 
    label: string;
    action_protocol: string;
  }[];
  fire_propagation_analysis: {
    affected_room_id: string;
    room_name: string;
    impact_type: 'THERMAL' | 'SMOKE' | 'EXPLOSION' | 'STRUCTURAL_COLLAPSE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    time_to_impact_estimate: string;
    reason: string;
  }[];
  tactical_recommendations: string[];
}

export interface StorageRecommendation {
  recommended_room_id: string;
  room_name: string;
  reasoning: string;
  safety_tips: string;
}
