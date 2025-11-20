# How GIST Physics Simulator Works

## Overview

GIST (Generative Interactive Simulations for Teaching) is a JSON-driven physics simulation platform built on React and Matter.js. The system allows educators to create interactive physics simulations by simply providing a JSON configuration, without writing any code.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Home.tsx                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Sim Selector│  │ New Sim BTN  │  │ Delete BTN   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              JsonSimulation Component                 │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │         BaseSimulation Component                │  │ │
│  │  │  ┌───────────────────────────────────────────┐  │  │ │
│  │  │  │        Matter.js Engine                   │  │  │ │
│  │  │  │  • Physics World                          │  │  │ │
│  │  │  │  • Gravity                                │  │  │ │
│  │  │  │  • Collision Detection                    │  │  │ │
│  │  │  │  • Animation Loop                         │  │  │ │
│  │  │  └───────────────────────────────────────────┘  │  │ │
│  │  │                                                   │  │ │
│  │  │  Simulation Components:                          │  │ │
│  │  │  • Objects (circles, rectangles)                 │  │ │
│  │  │  • Environment (walls)                           │  │ │
│  │  │  • Controls (sliders)                            │  │ │
│  │  │  • Outputs (value displays)                      │  │ │
│  │  │  • Graphs (time-series charts)                   │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  localStorage       │
              │  • Simulations      │
              │  • Edit History     │
              │  • Current Sim ID   │
              └─────────────────────┘
```

## Matter.js Integration

### What is Matter.js?

Matter.js is a 2D rigid body physics engine for the web. It handles:
- **Gravity simulation**
- **Collision detection and response**
- **Velocity and acceleration calculations**
- **Static and dynamic bodies**
- **Rendering (optional - we use it for canvas rendering)**

### How We Use Matter.js

#### 1. Engine Initialization (`BaseSimulation.tsx`)

```typescript
// Create the Matter.js engine (the physics world)
const engine = Matter.Engine.create({
  gravity: { x: 0, y: 1, scale: 0.001 }  // Downward gravity
});

// Create the renderer (draws to canvas)
const render = Matter.Render.create({
  canvas: canvasRef.current,
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,  // Use actual colors, not wireframe
    background: '#ffffff'
  }
});
```

**Key Architectural Choice**: We create a single Matter.js engine instance per simulation and provide it via React Context (`PhysicsContext`) so child components can add bodies to the world.

#### 2. Animation Loop (`BaseSimulation.tsx`)

Rather than using Matter.js's built-in runner, we implement a **manual animation loop** for finer control:

```typescript
const animate = () => {
  if (!isRunningRef.current) return;

  // Update the physics engine (one step forward in time)
  Matter.Engine.update(engine, 1000 / 60);  // 60 FPS

  // Update the renderer
  Matter.Render.world(render);

  // Track elapsed time
  timeRef.current += 1000 / 60 / 1000;  // Convert to seconds

  // Notify parent components (for graphs, outputs)
  if (onUpdate) {
    onUpdate(engine, timeRef.current);
  }

  animationFrameRef.current = requestAnimationFrame(animate);
};
```

**Why manual loop?**
- **Precise timing control** for graphs and outputs
- **Pause/resume functionality** (stop/start the loop)
- **Reset capability** (restore initial body states)
- **Integration with React state** (onUpdate callback)

#### 3. Creating Physics Bodies (`Object.tsx`)

Each simulation object becomes a Matter.js **Body**:

```typescript
// Create a circle body
const body = Matter.Bodies.circle(
  objectConfig.x,
  objectConfig.y,
  objectConfig.width / 2,
  {
    restitution: objectConfig.restitution || 0.8,  // Bounciness
    frictionAir: objectConfig.frictionAir || 0,    // Air resistance
    render: { fillStyle: objectConfig.color }
  }
);

// Set initial velocity
Matter.Body.setVelocity(body, {
  x: objectConfig.velocity.x,
  y: objectConfig.velocity.y
});

// Add to the physics world
Matter.World.add(engine.world, body);
```

**Key Points**:
- Bodies are **automatically simulated** by Matter.js (gravity, collisions)
- We expose the body via React `useImperativeHandle` so other components can read/modify it
- Bodies are stored in `objRefs` by ID for quick lookup

#### 4. Static Bodies for Environment (`Environment.tsx`)

Walls are **static bodies** (they don't move):

```typescript
const createWall = (x, y, width, height) => {
  return Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,  // Won't be affected by gravity or collisions
    render: { fillStyle: '#cccccc' }
  });
};

// Bottom wall
const bottomWall = createWall(400, 600, 800, 40);
Matter.World.add(engine.world, bottomWall);
```

**Architectural Choice**: Walls are separate static bodies rather than canvas boundaries, allowing for flexible boundary configurations (top, bottom, left, right, or none).

#### 5. Dynamic Property Updates (`JsonSimulation.tsx`)

We can modify bodies in real-time using Matter.js setters:

```typescript
// Update velocity via slider
Matter.Body.setVelocity(body, { x: newValue, y: body.velocity.y });

// Update position via slider
Matter.Body.setPosition(body, { x: newValue, y: body.position.y });
```

**Key Insight**: Matter.js provides imperative APIs (`setVelocity`, `setPosition`) that work seamlessly with React's declarative model via refs.

## Component Architecture

### 1. BaseSimulation (Physics Engine Wrapper)

**Responsibilities**:
- Initialize Matter.js engine and renderer
- Manage animation loop (play/pause/reset)
- Provide physics engine via React Context
- Track simulation time
- Store initial body states for reset

**Key Design Decisions**:
- **Manual animation loop** instead of Matter.Runner for control
- **Context API** to share engine with child components
- **Initial state caching** to enable reset functionality

### 2. JsonSimulation (Configuration Manager)

**Responsibilities**:
- Parse JSON configuration
- Manage control values (slider states)
- Calculate derived properties (acceleration from velocity)
- Collect output values and graph data
- Handle simulation editing and saving

**Key Design Decisions**:
- **Declarative configuration** - JSON drives everything
- **Separation of concerns** - doesn't know about Matter.js details
- **Acceleration calculation** - derived from velocity changes over time
- **Callback-based architecture** - parent components notified of updates

### 3. Object Component (Physics Body Creator)

**Responsibilities**:
- Create Matter.js bodies (circles, rectangles)
- Set initial properties (position, velocity, color)
- Expose body reference to parent components

**Key Design Decisions**:
- **useImperativeHandle** to expose body ref without breaking React patterns
- **Automatic cleanup** on unmount (remove from physics world)
- **Shape abstraction** - supports multiple shapes with same interface

### 4. Environment Component (Boundary Manager)

**Responsibilities**:
- Create static wall bodies
- Configure which walls are present (top, bottom, left, right)

**Key Design Decisions**:
- **Optional walls** - JSON controls which boundaries exist
- **Static bodies** - walls never move or rotate
- **Fixed positions** - walls are always at canvas edges

### 5. Control Components (Interactive Parameters)

**Slider.tsx**:
- Maps UI slider to object property
- Supports nested properties (e.g., `velocity.x`)
- Real-time updates via Matter.js setters

**Key Design Decisions**:
- **Dot notation** for nested properties
- **Immediate updates** - no debouncing (smooth interaction)
- **Min/max constraints** defined in JSON

### 6. Output Components (Value Display)

**Outputs.tsx**:
- Read object properties in real-time
- Support for position, velocity, acceleration
- Formatted with units (px, px/s, px/s²)

**Key Design Decisions**:
- **Polling-based** - updated on every frame via `onUpdate` callback
- **Acceleration calculation** - `Δv / Δt` computed from velocity changes
- **Custom properties** - acceleration stored on body as `(body as any).acceleration`

### 7. Graph Component (Time-Series Visualization)

**Graph.tsx**:
- Uses Recharts for line graphs
- Plots multiple properties on same axes
- Configurable Y-axis range

**Key Design Decisions**:
- **Data accumulation** - points added only when simulation is running
- **Per-graph data arrays** - supports multiple independent graphs
- **Color-coded lines** - specified in JSON

## Data Flow

### 1. Initialization Flow

```
User Action (Load/Create Sim)
    ↓
Home.tsx loads JSON from localStorage
    ↓
JsonSimulation receives config prop
    ↓
BaseSimulation creates Matter.js engine
    ↓
Object components add bodies to world
    ↓
Environment adds static walls
    ↓
Animation loop starts
```

### 2. Update Flow (Each Frame)

```
requestAnimationFrame triggers
    ↓
Matter.Engine.update() - physics step
    ↓
Matter.Render.world() - draw to canvas
    ↓
onUpdate callback fired
    ↓
JsonSimulation reads body properties
    ↓
Calculate acceleration (Δv / Δt)
    ↓
Update output values (React state)
    ↓
Collect graph data points
    ↓
React re-renders outputs and graphs
```

### 3. Control Interaction Flow

```
User moves slider
    ↓
Slider onChange event
    ↓
JsonSimulation.handleControlChange()
    ↓
Update controlValues state (React)
    ↓
Matter.Body.setVelocity() or setPosition()
    ↓
Physics engine uses new value in next frame
```

### 4. Edit Flow

```
User clicks "Edit JSON"
    ↓
JsonEditor modal opens with current config
    ↓
User modifies JSON
    ↓
Validation (title, objects required)
    ↓
createSimulation(json, parentId)
    ↓
New entry in localStorage with parent link
    ↓
Home.tsx reloads simulation list
    ↓
New simulation loaded and displayed
```

## JSON Schema Architecture

### Design Philosophy

**Declarative, not imperative**: The JSON describes *what* the simulation should be, not *how* to create it. The system interprets the JSON and constructs the appropriate Matter.js objects.

### Schema Structure

```json
{
  "title": "string",           // Display name
  "description": "string",     // Educational context

  "environment": {             // World configuration
    "walls": ["left", "right", "top", "bottom"]
  },

  "objects": [                 // Dynamic physics bodies
    {
      "id": "unique_id",       // Reference in controls/outputs
      "shape": "circle|rectangle",
      "x": number,             // Initial position
      "y": number,
      "width": number,
      "height": number,
      "color": "#hex",
      "velocity": { "x": number, "y": number },
      "restitution": number,   // Bounciness 0-1
      "frictionAir": number    // Air resistance 0-1
    }
  ],

  "controls": [                // Interactive sliders
    {
      "type": "slider",
      "label": "string",
      "targetObj": "id",       // Which object to control
      "property": "velocity.x", // What property to modify
      "min": number,
      "max": number,
      "step": number,
      "defaultValue": number
    }
  ],

  "outputs": [                 // Real-time value displays
    {
      "title": "string",
      "values": [
        {
          "label": "string",
          "targetObj": "id",
          "property": "velocity.y",
          "unit": "px/s"
        }
      ]
    }
  ],

  "graphs": [                  // Time-series plots
    {
      "title": "string",
      "yAxisRange": { "min": number, "max": number },
      "lines": [
        {
          "label": "string",
          "targetObj": "id",
          "property": "acceleration.y",
          "color": "#hex"
        }
      ]
    }
  ]
}
```

### Key Architectural Decisions

1. **Object IDs as References**: Objects have `id` fields that controls, outputs, and graphs reference. This creates a clean separation between object definition and observation/control.

2. **Dot Notation for Properties**: Properties like `velocity.x` allow accessing nested values without complex JSON structures.

3. **Optional Sections**: Only `title` and `objects` are required. Controls, outputs, graphs, and environment are optional.

4. **Units as Metadata**: Units (px, px/s, px/s²) are stored in the JSON for display purposes, not used in calculations.

5. **Acceleration as Derived Property**: Acceleration isn't in the JSON - it's calculated from velocity changes. This keeps the JSON focused on initial conditions.

## Storage Architecture

### localStorage Schema

```typescript
// Key: 'gist_simulations'
// Value: Array of SimulationRecord
{
  id: number,              // Auto-increment ID
  created_at: string,      // ISO timestamp
  json: object,            // Full simulation config
  parent_id: number | null, // Edit history tracking
  title: string,           // Cached from json.title
  description: string      // Cached from json.description
}

// Key: 'gist_current_simulation_id'
// Value: number (ID of currently viewed simulation)
```

### Key Design Decisions

1. **No Server Dependency**: Everything stored in browser localStorage (survives page refresh, not browser clear).

2. **Edit History via Parent IDs**: When editing, create new record with `parent_id` pointing to original. This maintains version history without complex diff algorithms.

3. **Denormalized Title/Description**: Cached at top level for fast list rendering (don't need to parse JSON for every list item).

4. **Sample Data Pre-population**: First run automatically loads 2 sample simulations so users have working examples.

5. **Current Simulation Tracking**: Separate key stores which simulation is currently viewed, so returning to the app restores your state.

## Key Architectural Choices Summary

### 1. **React + Matter.js Integration**
- **Manual animation loop** rather than Matter.Runner
- **Context API** for sharing physics engine
- **Refs for imperative access** to Matter.js bodies from React components

### 2. **JSON-Driven Architecture**
- **Declarative configuration** - what, not how
- **Separation of concerns** - JSON defines physics, components implement
- **Extensible schema** - easy to add new object types or properties

### 3. **Component Hierarchy**
- **BaseSimulation** - owns physics engine
- **JsonSimulation** - interprets configuration
- **Specialized components** - each handles one aspect (objects, walls, controls)

### 4. **State Management**
- **localStorage for persistence** - no server needed
- **React state for UI** - control values, outputs, graph data
- **Matter.js for physics** - positions, velocities managed by engine

### 5. **Performance Optimizations**
- **60 FPS fixed timestep** - consistent physics regardless of frame rate
- **Ref-based body access** - O(1) lookup by object ID
- **Conditional graph updates** - only collect data when running

### 6. **Educational Focus**
- **Pre-loaded examples** - learn by example
- **Edit history** - experiment without losing previous versions
- **Real-time feedback** - see effects of changes immediately
- **Multi-representation** - same data shown as numbers, graphs, and animation

## Matter.js Specific Implementation Details

### Physics World Configuration

```typescript
// Gravity scale: 0.001 makes 1 px/frame² feel natural
gravity: { x: 0, y: 1, scale: 0.001 }

// This gives approximately Earth-like gravity for educational simulations
// Students can see realistic projectile motion and bouncing
```

### Body Properties We Use

| Property | Matter.js Name | Purpose | Typical Range |
|----------|---------------|---------|---------------|
| Bounciness | `restitution` | Energy retained after collision | 0-1 (0=no bounce, 1=perfect bounce) |
| Air Drag | `frictionAir` | Velocity loss per frame | 0-0.1 (0=no drag, 0.1=heavy drag) |
| Mass | `density` | Implicitly calculated from area | Default: 0.001 |
| Static | `isStatic` | Whether body moves | true for walls |

### Why We Don't Use Matter.js Constraints

**Current approach**: No springs, ropes, or joints

**Reasoning**:
- Simpler mental model for educators
- JSON schema stays clean
- Easier to predict behavior
- Could be added later if needed

### Coordinate System

```
(0,0) ───────────────── (800,0)
  │                        │
  │                        │
  │    Matter.js World     │
  │    (Canvas Space)      │
  │                        │
  │                        │
(0,600) ──────────────── (800,600)

• X increases rightward
• Y increases downward (positive gravity)
• Velocity.y < 0 means upward motion
```

## Extending the System

### Adding a New Object Shape

1. Add shape type to JSON schema
2. Update `Object.tsx` to handle new shape:
   ```typescript
   case 'triangle':
     body = Matter.Bodies.polygon(x, y, 3, radius, options);
     break;
   ```

### Adding a New Control Type

1. Define in JSON schema
2. Create new component in `simulation_components/`
3. Import and render in `JsonSimulation.tsx`

### Adding Physics Features

Want to add friction, rotation, or other Matter.js features?

1. Add to JSON schema (e.g., `"friction": 0.5`)
2. Pass to Matter.js body creation options
3. Optionally expose in outputs/graphs

## Debugging Tips

### Viewing Matter.js World State

```typescript
// In browser console:
console.log(engine.world.bodies);  // All bodies in world
console.log(engine.world.bodies[0].position);  // Body position
console.log(engine.world.bodies[0].velocity);  // Body velocity
```

### Enabling Wireframe Mode

Temporarily see collision boundaries:
```typescript
// In BaseSimulation.tsx:
wireframes: true  // Change to true
```

### Checking localStorage

```typescript
// In browser console:
JSON.parse(localStorage.getItem('gist_simulations'))
```

## Performance Characteristics

- **Frame rate**: Fixed 60 FPS (16.67ms per frame)
- **Physics accuracy**: 1/60 second timesteps
- **Max objects**: ~100 before performance degrades (browser dependent)
- **Graph data**: Unbounded growth (cleared on reset)

## Future Enhancement Opportunities

1. **Variable timestep** - adaptive frame rate
2. **Touch/mobile support** - drag objects with finger
3. **Export/import** - share simulations as files
4. **Presets library** - curated collection beyond 2 samples
5. **3D physics** - migrate to Cannon.js or similar
6. **Collaborative editing** - real-time JSON co-editing
7. **Constraint support** - springs, ropes, joints
8. **Custom forces** - wind, magnets, user-defined

---

**Last Updated**: November 2025
**Matter.js Version**: 0.20.0
**React Version**: 19.1.1
