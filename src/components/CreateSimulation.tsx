import { useState, useEffect } from 'react';
import { createSimulation, setCurrentSimulationId } from '../lib/simulationService';

interface CreateSimulationProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationCreated?: (id: number) => void;
}

function CreateSimulation({
  isOpen,
  onClose,
  onSimulationCreated,
}: CreateSimulationProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setJsonInput('');
      setJsonError(null);
    }
  }, [isOpen]);

  // Handle creating from JSON paste
  const handleCreateFromJSON = async () => {
    if (!jsonInput.trim()) return;

    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput.trim());

      // Validate it has required fields for a simulation
      if (!parsed.title || !parsed.objects) {
        setJsonError('JSON must have "title" and "objects" fields');
        return;
      }

      // Create simulation
      const simulationId = await createSimulation(parsed, null);

      // Set as current simulation
      setCurrentSimulationId(simulationId);

      if (onSimulationCreated) {
        onSimulationCreated(simulationId);
      }

      onClose();
    } catch (error) {
      setJsonError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle Enter key (Ctrl/Cmd+Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreateFromJSON();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl" style={{ height: 'calc(90vh - 100px)' }}>
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-semibold">Paste Simulation JSON</h2>
            <p className="text-sm opacity-90">Paste your simulation JSON configuration below</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="h-[calc(100%-80px)] flex flex-col">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center text-gray-500 mb-4">
              <h3 className="text-lg font-semibold mb-2">Simulation JSON Format</h3>
              <p className="text-gray-600 text-sm">
                Your JSON should include <code className="bg-gray-100 px-1 rounded">title</code>, <code className="bg-gray-100 px-1 rounded">objects</code>, and optional <code className="bg-gray-100 px-1 rounded">environment</code>, <code className="bg-gray-100 px-1 rounded">controls</code>, <code className="bg-gray-100 px-1 rounded">outputs</code>, and <code className="bg-gray-100 px-1 rounded">graphs</code>.
              </p>
              <div className="mt-4 text-left max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold mb-2 text-sm">Minimal example:</p>
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "title": "Ball Drop",
  "objects": [
    {
      "id": "ball",
      "shape": "circle",
      "x": 400,
      "y": 100,
      "width": 60,
      "height": 60,
      "color": "#ff6bff",
      "velocity": { "x": 0, "y": 0 }
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-gray-200">
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
              }}
              onKeyDown={handleKeyPress}
              placeholder="Paste JSON simulation configuration here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              rows={10}
            />
            {jsonError && (
              <div className="mt-2 text-sm text-red-600">{jsonError}</div>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                Press Ctrl+Enter (or Cmd+Enter) to create
              </span>
              <button
                onClick={handleCreateFromJSON}
                disabled={!jsonInput.trim()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateSimulation;
