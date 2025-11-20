const STORAGE_KEY = 'gist_simulations';
const CURRENT_SIM_KEY = 'gist_current_simulation_id';

export interface SimulationRecord {
  id: number;
  created_at: string;
  json: any;
  parent_id: number | null;
  title: string | null;
  description: string | null;
}

export interface SimulationListItem {
  id: number;
  title: string | null;
  description: string | null;
  created_at: string;
  parent_id: number | null;
}

// Sample simulations to pre-populate
const SAMPLE_SIMULATIONS = [
  {
    "title": "Toss Ball",
    "description": "Toss a ball vertically and observe acceleration versus velocity",
    "environment": {
      "walls": []
    },
    "objects": [
      {
        "id": "ball",
        "shape": "circle",
        "x": 400,
        "y": 500,
        "width": 60,
        "height": 60,
        "color": "#ff6bff",
        "velocity": { "x": 0, "y": -20 },
        "restitution": 0.8,
        "frictionAir": 0
      }
    ],
    "controls": [
      {
        "type": "slider",
        "label": "Initial Velocity",
        "targetObj": "ball",
        "property": "velocity.y",
        "min": -30,
        "max": 0,
        "step": 0.1,
        "defaultValue": -20
      }
    ],
    "outputs": [
      {
        "title": "Ball Outputs",
        "values": [
          {
            "label": "Velocity",
            "targetObj": "ball",
            "property": "velocity.y",
            "unit": "px/s"
          },
          {
            "label": "Acceleration",
            "targetObj": "ball",
            "property": "acceleration.y",
            "unit": "px/s²"
          }
        ]
      }
    ],
    "graphs": [
      {
        "title": "Velocity and Acceleration Over Time",
        "yAxisRange": { "min": -20, "max": 20 },
        "lines": [
          {
            "label": "Velocity",
            "targetObj": "ball",
            "property": "velocity.y",
            "color": "#ff6bff"
          },
          {
            "label": "Acceleration",
            "targetObj": "ball",
            "property": "acceleration.y",
            "color": "#4ecdc4"
          }
        ]
      }
    ]
  },
  {
    "title": "Two Boxes Collision",
    "description": "Adjust the velocities to see the boxes move and collide",
    "environment": {
      "walls": ["left", "right", "bottom"]
    },
    "objects": [
      {
        "id": "boxA",
        "shape": "rectangle",
        "x": 150,
        "y": 100,
        "width": 60,
        "height": 60,
        "color": "#ff6bff",
        "velocity": { "x": 5, "y": 0 },
        "restitution": 0.8,
        "frictionAir": 0
      },
      {
        "id": "boxB",
        "shape": "rectangle",
        "x": 650,
        "y": 200,
        "width": 60,
        "height": 60,
        "color": "#4ecdc4",
        "velocity": { "x": -5, "y": 0 },
        "restitution": 0.8,
        "frictionAir": 0
      }
    ],
    "controls": [
      {
        "type": "slider",
        "label": "Box A Velocity",
        "targetObj": "boxA",
        "property": "velocity.x",
        "min": -10,
        "max": 10,
        "step": 0.1,
        "defaultValue": 5
      },
      {
        "type": "slider",
        "label": "Box B Velocity",
        "targetObj": "boxB",
        "property": "velocity.x",
        "min": -10,
        "max": 10,
        "step": 0.1,
        "defaultValue": -5
      }
    ],
    "outputs": [
      {
        "title": "Box A Outputs",
        "values": [
          {
            "label": "Velocity X",
            "targetObj": "boxA",
            "property": "velocity.x",
            "unit": "px/s"
          },
          {
            "label": "Velocity Y",
            "targetObj": "boxA",
            "property": "velocity.y",
            "unit": "px/s"
          }
        ]
      },
      {
        "title": "Box B Outputs",
        "values": [
          {
            "label": "Velocity X",
            "targetObj": "boxB",
            "property": "velocity.x",
            "unit": "px/s"
          },
          {
            "label": "Velocity Y",
            "targetObj": "boxB",
            "property": "velocity.y",
            "unit": "px/s"
          }
        ]
      }
    ],
    "graphs": [
      {
        "title": "Horizontal Velocity Over Time",
        "yAxisRange": { "min": -10, "max": 10 },
        "lines": [
          {
            "label": "Box A Velocity X",
            "targetObj": "boxA",
            "property": "velocity.x",
            "color": "#ff6bff"
          },
          {
            "label": "Box B Velocity X",
            "targetObj": "boxB",
            "property": "velocity.x",
            "color": "#4ecdc4"
          }
        ]
      }
    ]
  }
];

/**
 * Gets all simulations from localStorage
 */
function getStoredSimulations(): SimulationRecord[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Saves simulations to localStorage
 */
function saveSimulations(simulations: SimulationRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
}

/**
 * Initializes localStorage with sample simulations if empty
 */
export function initializeStorage(): void {
  const existing = getStoredSimulations();
  if (existing.length === 0) {
    // Pre-populate with sample simulations
    const sampleRecords: SimulationRecord[] = SAMPLE_SIMULATIONS.map((json, index) => ({
      id: index + 1,
      created_at: new Date().toISOString(),
      json,
      parent_id: null,
      title: json.title,
      description: json.description,
    }));
    saveSimulations(sampleRecords);
  }
}

/**
 * Gets the next available ID
 */
function getNextId(): number {
  const simulations = getStoredSimulations();
  if (simulations.length === 0) {
    return 1;
  }
  const maxId = Math.max(...simulations.map(s => s.id));
  return maxId + 1;
}

/**
 * Creates a new simulation in localStorage
 * @param json - The simulation JSON configuration
 * @param parentId - The ID of the parent simulation (null for new simulations)
 * @returns The ID of the created simulation
 */
export async function createSimulation(
  json: any,
  parentId: number | null = null
): Promise<number> {
  const simulations = getStoredSimulations();

  const newSimulation: SimulationRecord = {
    id: getNextId(),
    created_at: new Date().toISOString(),
    json,
    parent_id: parentId,
    title: json.title || null,
    description: json.description || null,
  };

  simulations.push(newSimulation);
  saveSimulations(simulations);

  return newSimulation.id;
}

/**
 * Fetches a simulation by ID from localStorage
 * @param id - The simulation ID
 * @returns The simulation JSON configuration
 */
export async function getSimulation(id: number): Promise<any> {
  const simulations = getStoredSimulations();
  const simulation = simulations.find(s => s.id === id);

  if (!simulation) {
    throw new Error(`Simulation with ID ${id} not found`);
  }

  return simulation.json;
}

/**
 * Gets the full simulation record by ID
 * @param id - The simulation ID
 * @returns The full simulation record
 */
export async function getSimulationRecord(id: number): Promise<SimulationRecord> {
  const simulations = getStoredSimulations();
  const simulation = simulations.find(s => s.id === id);

  if (!simulation) {
    throw new Error(`Simulation with ID ${id} not found`);
  }

  return simulation;
}

/**
 * Fetches all simulations from localStorage, sorted by creation date (newest first)
 * @returns Array of simulation list items with id, title, description, and created_at
 */
export async function getAllSimulations(): Promise<SimulationListItem[]> {
  const simulations = getStoredSimulations();

  // Sort by created_at descending (newest first)
  const sorted = [...simulations].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sorted.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    created_at: s.created_at,
    parent_id: s.parent_id,
  }));
}

/**
 * Gets the currently selected simulation ID from localStorage
 */
export function getCurrentSimulationId(): number | null {
  const stored = localStorage.getItem(CURRENT_SIM_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * Sets the currently selected simulation ID in localStorage
 */
export function setCurrentSimulationId(id: number | null): void {
  if (id === null) {
    localStorage.removeItem(CURRENT_SIM_KEY);
  } else {
    localStorage.setItem(CURRENT_SIM_KEY, id.toString());
  }
}

/**
 * Deletes a simulation by ID
 */
export async function deleteSimulation(id: number): Promise<void> {
  const simulations = getStoredSimulations();
  const filtered = simulations.filter(s => s.id !== id);
  saveSimulations(filtered);

  // If this was the current simulation, clear it
  if (getCurrentSimulationId() === id) {
    setCurrentSimulationId(null);
  }
}
