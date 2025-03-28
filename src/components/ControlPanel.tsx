
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DijkstraStep } from '@/utils/dijkstra';
import { Graph } from '@/utils/graphUtils';

interface ControlPanelProps {
  className?: string;
  isRunning: boolean;
  canRun: boolean;
  onStartAlgorithm: () => void;
  onResetAlgorithm: () => void;
  onNextStep: () => void;
  onAutoRun: () => void;
  currentStep: number;
  totalSteps: number;
  startNodeId: string | null;
  endNodeId: string | null;
  onSelectStartNode: () => void;
  onSelectEndNode: () => void;
  editorMode: 'edit' | 'view';
  setEditorMode: (mode: 'edit' | 'view') => void;
  graph: Graph; // Added to access node labels
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  className,
  isRunning,
  canRun,
  onStartAlgorithm,
  onResetAlgorithm,
  onNextStep,
  onAutoRun,
  currentStep,
  totalSteps,
  startNodeId,
  endNodeId,
  onSelectStartNode,
  onSelectEndNode,
  editorMode,
  setEditorMode,
  graph
}) => {
  // Helper function to get node label from ID
  const getNodeLabel = (nodeId: string | null): string => {
    if (!nodeId) return 'Not selected';
    const node = graph.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };

  return (
    <div
      className={cn(
        "p-5 rounded-lg bg-white/80 backdrop-blur border border-gray-100 flex flex-col",
        className
      )}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Algorithm Controls</h3>
      
      {/* Node Selection */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Start Node:</span>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-start"></div>
            <span className="text-sm font-medium">{getNodeLabel(startNodeId)}</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={onSelectStartNode}
              disabled={isRunning || editorMode === 'view'}
            >
              Select
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">End Node:</span>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-end"></div>
            <span className="text-sm font-medium">{getNodeLabel(endNodeId)}</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={onSelectEndNode}
              disabled={isRunning || editorMode === 'view'}
            >
              Select
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mode Switch */}
      <div className="mb-6">
        <div className="flex rounded-md overflow-hidden border border-gray-200">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              editorMode === 'edit'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setEditorMode('edit')}
            disabled={isRunning}
          >
            Edit Mode
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              editorMode === 'view'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setEditorMode('view')}
          >
            View Mode
          </button>
        </div>
      </div>
      
      {/* Algorithm Controls */}
      <div className="space-y-3">
        {!isRunning ? (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onStartAlgorithm}
            disabled={!canRun}
          >
            Run Dijkstra's Algorithm
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress:</span>
              <span className="text-sm font-medium">
                Step {currentStep} of {totalSteps > 0 ? totalSteps : '?'}
              </span>
            </div>
            
            <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onNextStep}
                disabled={currentStep >= totalSteps}
              >
                Next Step
              </Button>
              <Button
                variant="outline"
                onClick={onAutoRun}
                disabled={currentStep >= totalSteps}
              >
                Auto Run
              </Button>
            </div>
          </>
        )}
        
        <Button
          variant="ghost"
          className="w-full"
          onClick={onResetAlgorithm}
          disabled={!isRunning && !startNodeId && !endNodeId}
        >
          Reset
        </Button>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-start"></div>
            <span className="text-xs text-gray-600">Start Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-end"></div>
            <span className="text-xs text-gray-600">End Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-visited"></div>
            <span className="text-xs text-gray-600">Visited Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-current"></div>
            <span className="text-xs text-gray-600">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-node-path"></div>
            <span className="text-xs text-gray-600">Path Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 bg-edge-path rounded-sm"></div>
            <span className="text-xs text-gray-600">Path Edge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
