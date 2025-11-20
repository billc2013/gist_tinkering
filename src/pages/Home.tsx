import { useState, useEffect } from 'react';
import CreateSimulation from '../components/CreateSimulation';
import JsonSimulation from '../components/JsonSimulation';
import {
  getAllSimulations,
  getSimulation,
  initializeStorage,
  getCurrentSimulationId,
  setCurrentSimulationId,
  deleteSimulation,
  SimulationListItem,
} from '../lib/simulationService';

function Home() {
  const [showModal, setShowModal] = useState(false);
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [currentSimId, setCurrentSimId] = useState<number | null>(null);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load simulations
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize localStorage with sample simulations if needed
      initializeStorage();

      // Load all simulations
      const sims = await getAllSimulations();
      setSimulations(sims);

      // Try to restore last viewed simulation, or load first one
      let simId = getCurrentSimulationId();
      if (!simId && sims.length > 0) {
        simId = sims[0].id;
      }

      if (simId) {
        await loadSimulation(simId);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulation = async (id: number) => {
    try {
      const config = await getSimulation(id);
      setCurrentSimId(id);
      setCurrentConfig(config);
      setCurrentSimulationId(id);
    } catch (error) {
      console.error('Failed to load simulation:', error);
      setCurrentSimId(null);
      setCurrentConfig(null);
    }
  };

  const handleSimulationCreated = async (id: number) => {
    // Reload simulation list
    const sims = await getAllSimulations();
    setSimulations(sims);

    // Load the new simulation
    await loadSimulation(id);
  };

  const handleSimulationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (!isNaN(id)) {
      loadSimulation(id);
    }
  };

  const handleSimulationUpdated = async (newSimId: number) => {
    // Reload simulation list to show the new version
    const sims = await getAllSimulations();
    setSimulations(sims);

    // Load the new simulation
    await loadSimulation(newSimId);
  };

  const handleDeleteSimulation = async (id: number) => {
    if (confirm('Are you sure you want to delete this simulation?')) {
      try {
        await deleteSimulation(id);

        // Reload simulation list
        const sims = await getAllSimulations();
        setSimulations(sims);

        // If we deleted the current simulation, clear it
        if (id === currentSimId) {
          setCurrentSimId(null);
          setCurrentConfig(null);

          // Load first available simulation if any
          if (sims.length > 0) {
            await loadSimulation(sims[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to delete simulation:', error);
        alert('Failed to delete simulation');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800 mb-4 font-semibold">
          GIST Physics Simulator
        </h1>
        <p className="text-gray-600 mb-6">
          Paste JSON configurations from any LLM to create interactive physics simulations
        </p>

        {/* Simulation Selector */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="sim-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Simulation:
            </label>
            <select
              id="sim-select"
              value={currentSimId || ''}
              onChange={handleSimulationChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={simulations.length === 0}
            >
              {simulations.length === 0 ? (
                <option value="">No simulations yet</option>
              ) : (
                simulations.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.title || `Simulation ${sim.id}`}
                    {sim.parent_id ? ' (edited)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
            >
              + New Simulation
            </button>

            {currentSimId && (
              <button
                onClick={() => handleDeleteSimulation(currentSimId)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
                title="Delete simulation"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Display */}
      {currentConfig ? (
        <div className="bg-white rounded-xl shadow-md">
          <JsonSimulation
            config={currentConfig}
            simulationId={currentSimId || undefined}
            onSimulationUpdated={handleSimulationUpdated}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl text-gray-600 mb-2">No Simulation Selected</h2>
          <p className="text-gray-500">
            Create a new simulation to get started
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Create Your First Simulation
          </button>
        </div>
      )}

      {/* Modal for Creating New Simulation */}
      <CreateSimulation
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSimulationCreated={handleSimulationCreated}
      />
    </div>
  );
}

export default Home;
