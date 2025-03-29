import React from 'react';
import { cn } from "@/lib/utils";
import { DijkstraStep } from '@/utils/dijkstra';

interface InfoPanelProps {
  className?: string;
  currentStep: DijkstraStep | null;
  shortestPath: string[] | null;
  shortestDistance: number | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  className,
  currentStep,
  shortestPath,
  shortestDistance
}) => {
  const getNodeLabel = (nodeId: string): string => {
    if (!currentStep) return nodeId;
    
    const node = currentStep.graph.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };
  
  if (!currentStep) {
    return (
      <div
        className={cn(
          "p-5 rounded-lg bg-white/80 backdrop-blur border border-gray-100",
          className
        )}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dijkstra's Algorithm</h3>
        <p className="text-sm text-gray-600 mb-4">
          Dijkstra's algorithm finds the shortest path between nodes in a graph. 
          Select start and end nodes to run the algorithm.
        </p>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-1">How It Works</h4>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Initialize distances (infinity for all nodes except start node)</li>
              <li>Mark all nodes as unvisited</li>
              <li>For the current node, calculate distances to unvisited neighbors</li>
              <li>Mark the current node as visited</li>
              <li>Select the unvisited node with the smallest distance as current</li>
              <li>Repeat until the end node is reached or no path exists</li>
            </ol>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Instructions</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Create nodes by clicking on the canvas</li>
              <li>• Connect nodes by clicking on a node, then another</li>
              <li>• Remove nodes/edges with right-click</li>
              <li>• Select start and end nodes from the control panel</li>
              <li>• Run the algorithm to find the shortest path</li>
            </ul>
          </div>
          
          <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Limitations</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• <span className="font-medium">Negative Edges:</span> Dijkstra's algorithm doesn't work with negative edge weights as it can lead to incorrect results</li>
              <li>• <span className="font-medium">Negative Cycles:</span> Graphs with negative cycles (where the sum of edges in a cycle is negative) cause the algorithm to fail</li>
              <li>• For graphs with negative weights, use Bellman-Ford or other algorithms instead</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  const { distances, previous, currentNode, visitedNodes } = currentStep;
  
  return (
    <div
      className={cn(
        "p-5 rounded-lg bg-white/80 backdrop-blur border border-gray-100 overflow-auto",
        className
      )}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-2">Algorithm Progress</h3>
      
      {/* Current Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Node:</span>
          <span className="text-sm font-medium">{currentNode ? getNodeLabel(currentNode) : 'None (Algorithm finished)'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Visited Nodes:</span>
          <span className="text-sm font-medium">{visitedNodes.size}</span>
        </div>
      </div>
      
      {/* Distances */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Distances</h4>
        <div className="max-h-28 overflow-y-auto bg-gray-50 rounded-md p-2 border border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-1 font-medium text-gray-600">Node</th>
                <th className="text-right p-1 font-medium text-gray-600">Distance</th>
                <th className="text-right p-1 font-medium text-gray-600">Previous</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(distances.entries()).map(([nodeId, distance]) => (
                <tr key={nodeId} className="border-b border-gray-100 last:border-0">
                  <td className="p-1 font-medium">{getNodeLabel(nodeId)}</td>
                  <td className="p-1 text-right">
                    {distance === Infinity ? '∞' : distance}
                  </td>
                  <td className="p-1 text-right text-gray-600">
                    {previous.get(nodeId) ? getNodeLabel(previous.get(nodeId)!) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Result Section (Shown when algorithm is complete) */}
      {currentStep.isDone && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Results</h4>
          
          {shortestPath ? (
            <>
              <div className="mb-2">
                <span className="text-xs text-gray-700">Shortest Path: </span>
                <span className="text-xs font-medium">
                  {shortestPath.map(nodeId => getNodeLabel(nodeId)).join(' → ')}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-700">Total Distance: </span>
                <span className="text-xs font-medium">{shortestDistance}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-red-600">
              No path exists between the selected nodes.
            </div>
          )}
          
          <div className="mt-3 pt-2 border-t border-blue-100">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Note:</span> Remember that Dijkstra's algorithm only works with positive edge weights. Negative weights or cycles would invalidate the results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
