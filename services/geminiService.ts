import { GoogleGenAI, Type } from "@google/genai";
import { FIRE_SAFETY_SYSTEM_INSTRUCTION } from "../constants";
import { RoomData, RoomAnalysisResponse, EmergencyResponse, StorageOptimizationResponse, FireSimulationResponse, StorageRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const detectRooms = async (
  imageBase64: string,
  mimeType: string
): Promise<RoomData[]> => {
  try {
    const prompt = `
      Analyze this floor plan image to identify storage zones.
      
      STRICT DETECTION RULES:
      1. Identify ONLY clearly delineated, fully enclosed rooms or confirmed major storage zones.
      2. IGNORE hallways, corridors, stairwells, lobbies, or any ambiguous open spaces.
      3. If a space is not clearly a specific room (e.g., walls are missing or it looks like a transit area), DO NOT label it.
      4. Estimate the center coordinates (x, y) as percentages (0-100).
      
      Output Format: JSON
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        rooms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)" },
              y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)" },
            },
            required: ["x", "y"]
          }
        }
      },
      required: ["rooms"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.rooms.map((r: any, index: number) => ({
        id: `auto-${Date.now()}-${index}`,
        name: `Room ${index + 1}`,
        inventory: "Empty", 
        coords: { x: r.x, y: r.y }
      }));
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Detect Rooms Error:", error);
    throw error;
  }
};

export const findSafeStorage = async (
  imageBase64: string,
  mimeType: string,
  rooms: RoomData[],
  itemDescription: string
): Promise<StorageRecommendation> => {
  try {
    const roomContext = rooms.map(r => `- Room: "${r.name}" (ID: ${r.id})\n  Current Inventory: ${r.inventory}`).join("\n");

    const prompt = `
      Context: User wants to store a NEW ITEM in the facility.
      New Item: "${itemDescription}"
      
      Existing Zones & Inventory:
      ${roomContext}
      
      STRICT STORAGE SAFETY RULES:
      1. Incompatible or interactive materials (e.g., fuels vs oxidizers, or items that cause secondary explosions) MUST be separated by a safe distance.
      2. DO NOT suggest a room that is ADJACENT to (shares a wall or is directly next to) a room containing materials that could interact dangerously with the new item.
      3. Maintain a buffer of at least one empty or non-hazardous room between major interactive hazard classes.
      
      Identify the SAFEST Room for this new item.
      
      Output Format: JSON
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        recommended_room_id: { type: Type.STRING },
        room_name: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        safety_tips: { type: Type.STRING },
      },
      required: ["recommended_room_id", "room_name", "reasoning", "safety_tips"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StorageRecommendation;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Find Safe Storage Error:", error);
    throw error;
  }
};

export const generateStorageOptimization = async (
  imageBase64: string,
  mimeType: string,
  rooms: RoomData[]
): Promise<StorageOptimizationResponse> => {
  try {
    const roomContext = rooms.map(r => {
      const loc = r.coords ? ` [Map Coords: X=${r.coords.x.toFixed(1)}%, Y=${r.coords.y.toFixed(1)}%]` : "";
      return `- Room: "${r.name}" (ID: ${r.id})${loc}\n  Inventory: ${r.inventory}`;
    }).join("\n");

    const prompt = `
      Context: Factory Inventory Optimization.
      Data: 
      ${roomContext}
      
      STRICT SAFETY RULE:
      Interactive materials (those that enhance combustion or trigger explosions) MUST NOT be stored in adjacent rooms.
      There must be a safe separation distance. Ensure that high-risk materials are relocated so that they do not share boundaries with incompatible hazards.
      
      Goal: Reorganize the facility to minimize fire propagation risk and ensure interactive materials are far apart.
      
      Output Format: JSON
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        safety_status: { type: Type.STRING, enum: ['SAFE', 'UNSAFE', 'CRITICAL'] },
        safety_assessment: { type: Type.STRING },
        relocation_plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item_name: { type: Type.STRING },
              current_room: { type: Type.STRING },
              suggested_room: { type: Type.STRING },
              reason: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
            }
          }
        },
        recommended_zone_layouts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              room_id: { type: Type.STRING },
              room_name: { type: Type.STRING },
              assigned_items: { type: Type.ARRAY, items: { type: Type.STRING } },
              safety_rationale: { type: Type.STRING },
              compatibility_notes: { type: Type.STRING },
            }
          }
        },
        segregation_rules_applied: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["safety_status", "safety_assessment", "relocation_plan", "recommended_zone_layouts", "segregation_rules_applied"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StorageOptimizationResponse;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Storage Optimization Error:", error);
    throw error;
  }
};

export const simulateFireSpread = async (
  imageBase64: string,
  mimeType: string,
  allRooms: RoomData[],
  fireRoomIds: string[]
): Promise<FireSimulationResponse> => {
  try {
    const roomContext = allRooms.map(r => {
      const loc = r.coords ? ` [Map Coords: X=${r.coords.x.toFixed(1)}%, Y=${r.coords.y.toFixed(1)}%]` : "";
      return `- Room: "${r.name}" (ID: ${r.id})${loc}\n  Inventory: ${r.inventory}`;
    }).join("\n");

    const fireRoomNames = allRooms
      .filter(r => fireRoomIds.includes(r.id))
      .map(r => r.name)
      .join(", ");

    const prompt = `
      Context: Active Fire Incident.
      Origin(s): [ ${fireRoomNames} ].
      
      Floor Plan and Inventory:
      ${roomContext}

      Request:
      1. Calculate firefighter entry path.
      2. Predict spread to adjacent rooms based on chemical hazards.
      3. Identify tactical danger/caution points.
      
      Output Format: JSON
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        simulation_id: { type: Type.STRING },
        primary_fire_zones: { type: Type.ARRAY, items: { type: Type.STRING } },
        firefighter_entry_route: {
          type: Type.OBJECT,
          properties: {
            entry_point: { type: Type.STRING },
            path_description: { type: Type.STRING },
            hazards_on_path: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimated_risk: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] }
          }
        },
        route_coordinates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            }
          }
        },
        tactical_markers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ['CAUTION', 'DANGER'] },
              label: { type: Type.STRING },
              action_protocol: { type: Type.STRING }
            }
          }
        },
        fire_propagation_analysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              affected_room_id: { type: Type.STRING },
              room_name: { type: Type.STRING },
              impact_type: { type: Type.STRING, enum: ['THERMAL', 'SMOKE', 'EXPLOSION', 'STRUCTURAL_COLLAPSE'] },
              severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              time_to_impact_estimate: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        },
        tactical_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["simulation_id", "primary_fire_zones", "firefighter_entry_route", "route_coordinates", "tactical_markers", "fire_propagation_analysis", "tactical_recommendations"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FireSimulationResponse;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Fire Simulation Error:", error);
    throw error;
  }
};

export const analyzeFacility = async (
  imageBase64: string,
  mimeType: string,
  rooms: RoomData[]
): Promise<string> => {
  try {
    const roomContext = rooms.map(r => {
      const loc = r.coords ? ` [Map Coords: X=${r.coords.x.toFixed(1)}%, Y=${r.coords.y.toFixed(1)}%]` : "";
      return `- Room/Zone: "${r.name}"${loc}\n  Inventory/Hazards: ${r.inventory}`;
    }).join("\n");

    const textPrompt = `
      Analyze the attached floor plan with this inventory:
      ${roomContext}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: textPrompt }
        ]
      },
      config: {
        systemInstruction: FIRE_SAFETY_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the facility data.");
  }
};

export const analyzeSpecificRoom = async (
  imageBase64: string,
  mimeType: string,
  room: RoomData
): Promise<RoomAnalysisResponse> => {
  try {
    const locationInfo = room.coords ? `Location on Map: X=${room.coords.x.toFixed(1)}%, Y=${room.coords.y.toFixed(1)}%` : "Location: Not mapped";
    const prompt = `Analyze room ${room.name} with inventory: ${room.inventory}. ${locationInfo}`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        report_title: { type: Type.STRING },
        room_id: { type: Type.STRING },
        safety_score: { type: Type.INTEGER },
        risk_level: { type: Type.STRING },
        key_findings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING },
            }
          }
        },
        corrective_actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              action_id: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING },
              due_date_suggestion: { type: Type.STRING },
            }
          }
        },
        additional_notes: { type: Type.STRING },
      },
      required: ["report_title", "room_id", "safety_score", "risk_level", "key_findings", "corrective_actions"]
    };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });
    if (response.text) return JSON.parse(response.text) as RoomAnalysisResponse;
    throw new Error("Empty response");
  } catch (error) {
    console.error("Room Analysis Error:", error);
    throw error;
  }
};

export const generateEmergencyPlan = async (
  imageBase64: string,
  mimeType: string,
  room: RoomData
): Promise<EmergencyResponse> => {
  try {
    const locationInfo = room.coords ? `(Map Location: X=${room.coords.x.toFixed(1)}%, Y=${room.coords.y.toFixed(1)}%)` : "";
    const prompt = `Fire reported in ${room.name} ${locationInfo}. Provide tactical instructions.`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        incident_summary: { type: Type.STRING },
        room_id: { type: Type.STRING },
        primary_hazards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hazard_type: { type: Type.STRING },
              details: { type: Type.STRING },
              urgency: { type: Type.STRING },
            }
          }
        },
        extinguishing_agents: {
          type: Type.OBJECT,
          properties: {
            recommended: { type: Type.ARRAY, items: { type: Type.STRING } },
            prohibited: { type: Type.ARRAY, items: { type: Type.STRING } },
            details: { type: Type.STRING },
          }
        },
        firefighter_ppe: { type: Type.ARRAY, items: { type: Type.STRING } },
        entry_exit_guidance: {
          type: Type.OBJECT,
          properties: {
            safest_entry_point: { type: Type.STRING },
            primary_evacuation_route: { type: Type.STRING },
            special_considerations: { type: Type.STRING },
          }
        },
        containment_strategy: { type: Type.STRING },
      },
      required: ["incident_summary", "room_id", "primary_hazards", "extinguishing_agents", "firefighter_ppe", "entry_exit_guidance", "containment_strategy"]
    };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });
    if (response.text) return JSON.parse(response.text) as EmergencyResponse;
    throw new Error("Empty response");
  } catch (error) {
    console.error("Emergency Plan Error:", error);
    throw error;
  }
};
