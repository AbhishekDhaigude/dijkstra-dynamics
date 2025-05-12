
import React, { useEffect, useRef, useState } from 'react';
import { 
  Node, 
  Edge, 
  Graph, 
  findNodeAt, 
  createNode, 
  edgeExists,
  findEdgeMidpoint,
  getNextLetterLabel
} from '@/utils/graphUtils';
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Weight } from "lucide-react";

interface GraphCanvasProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  mode: 'edit' | 'view';
  startNodeId: string | null;
  endNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  isRunning: boolean;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  graph, 
  onGraphChange, 
  mode,
  startNodeId,
  endNodeId,
  onSelectNode,
  isRunning
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{source: string, target: string} | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<number>(1);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectingForAlgorithm, setSelectingForAlgorithm] = useState(false);
  const [nodeSelectionPurpose, setNodeSelectionPurpose] = useState<'start' | 'end' | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  
  // Force the popover to open when pendingEdge is set
  useEffect(() => {
    if (pendingEdge) {
      // Calculate popover position between the two nodes
      const sourceNode = graph.nodes.find(n => n.id === pendingEdge.source);
      const targetNode = graph.nodes.find(n => n.id === pendingEdge.target);
      
      if (sourceNode && targetNode) {
        const midpoint = findEdgeMidpoint(sourceNode, targetNode);
        setPopoverPosition({ x: midpoint.x, y: midpoint.y });
      }
      
      // Ensure popover opens
      setPopoverOpen(true);
    }
  }, [pendingEdge, graph.nodes]);
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== 'edit' || isRunning) {
      return;
    }
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = findNodeAt(graph.nodes, x, y);
    
    if (clickedNode) {
      // Check if we're selecting start/end nodes for the algorithm
      if (selectingForAlgorithm) {
        // Prevent selecting a node that's already set as the other endpoint
        if (nodeSelectionPurpose === 'start' && clickedNode.id === endNodeId) {
          toast.error("Can't use the same node for both start and end");
          return;
        }
        
        if (nodeSelectionPurpose === 'end' && clickedNode.id === startNodeId) {
          toast.error("Can't use the same node for both start and end");
          return;
        }
        
        onSelectNode(clickedNode.id);
        setSelectingForAlgorithm(false);
        setNodeSelectionPurpose(null);
        toast.success(`Selected node ${clickedNode.label} as ${nodeSelectionPurpose === 'start' ? 'start' : 'end'} node`);
        return;
      }
      
      // If a node is already selected, prepare to create an edge between them
      if (selectedNode && selectedNode !== clickedNode.id) {
        if (!edgeExists(graph.edges, selectedNode, clickedNode.id)) {
          // Set up pending edge and show weight selection popover
          setPendingEdge({
            source: selectedNode,
            target: clickedNode.id
          });
          
          // Calculate default weight based on distance
          const sourceNode = graph.nodes.find(n => n.id === selectedNode);
          const targetNode = clickedNode;
          if (sourceNode && targetNode) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const defaultWeight = Math.max(1, Math.round(distance / 30));
            setEdgeWeight(defaultWeight);
          } else {
            setEdgeWeight(1);
          }
          
          // Force popover to open after state update
          setTimeout(() => {
            setPopoverOpen(true);
          }, 10);
        } else {
          toast.info("Edge already exists between these nodes");
          setSelectedNode(null);
        }
      } else {
        // Select this node
        setSelectedNode(clickedNode.id);
        toast.info(`Node ${clickedNode.label} selected. Click another node to create an edge.`);
      }
    } else {
      // Create a new node at click position with next letter
      const nextLetter = getNextLetterLabel(graph.nodes);
      const newNode = createNode(x, y, nextLetter);
      onGraphChange({
        nodes: [...graph.nodes, newNode],
        edges: [...graph.edges]
      });
      setSelectedNode(null);
      toast.success(`Created node ${nextLetter}`);
    }
  };
  
  // Monitor for selection mode changes from parent component
  useEffect(() => {
    const detectSelectionModeChange = () => {
      if (startNodeId === null) {
        setNodeSelectionPurpose('start');
        setSelectingForAlgorithm(true);
      } else if (endNodeId === null) {
        setNodeSelectionPurpose('end');
        setSelectingForAlgorithm(true);
      } else {
        setNodeSelectionPurpose(null);
        setSelectingForAlgorithm(false);
      }
    };
    
    detectSelectionModeChange();
    
    return () => {
      // Clean up effect
    };
  }, [startNodeId, endNodeId]);
  
  // Handle external requests to select a node
  useEffect(() => {
    return () => {
      // Clean up
    };
  }, [onSelectNode]);
  
  // This function handles the external "Select Start" and "Select End" button clicks
  const handleExternalNodeSelectionRequest = (purpose: 'start' | 'end') => {
    setNodeSelectionPurpose(purpose);
    setSelectingForAlgorithm(true);
    setSelectedNode(null);
    setPendingEdge(null);
    setPopoverOpen(false);
    
    toast.info(`Click a node to set as ${purpose} node`);
  };
  
  // Expose the function to parent through a ref
  useEffect(() => {
    // Listen for controls from parent component
    if (!startNodeId) {
      handleExternalNodeSelectionRequest('start');
    } else if (!endNodeId) {
      handleExternalNodeSelectionRequest('end');
    }
  }, [startNodeId, endNodeId]);
  
  const confirmEdgeCreation = () => {
    if (!pendingEdge) return;
    
    const newEdge = {
      id: `${pendingEdge.source}-${pendingEdge.target}`,
      source: pendingEdge.source,
      target: pendingEdge.target,
      weight: edgeWeight,
      status: 'default' as const
    };
    
    onGraphChange({
      nodes: [...graph.nodes],
      edges: [...graph.edges, newEdge]
    });
    
    const sourceLabel = graph.nodes.find(n => n.id === pendingEdge.source)?.label;
    const targetLabel = graph.nodes.find(n => n.id === pendingEdge.target)?.label;
    
    toast.success(`Edge created from ${sourceLabel} to ${targetLabel} with weight ${edgeWeight}`);
    setPendingEdge(null);
    setSelectedNode(null);
    setPopoverOpen(false);
  };
  
  const cancelEdgeCreation = () => {
    setPendingEdge(null);
    setSelectedNode(null);
    setPopoverOpen(false);
  };
  
  // Handle node selection for algorithm
  const handleNodeSelectionForAlgorithm = (nodeId: string) => {
    if (selectingForAlgorithm) {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // Verify that this isn't already set as the other endpoint
      if (nodeSelectionPurpose === 'start' && nodeId === endNodeId) {
        toast.error("Cannot use the same node for both start and end");
        return;
      }
      if (nodeSelectionPurpose === 'end' && nodeId === startNodeId) {
        toast.error("Cannot use the same node for both start and end");
        return;
      }
      
      onSelectNode(nodeId);
      setSelectingForAlgorithm(false);
      setNodeSelectionPurpose(null);
    }
  };
  
  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    if (mode !== 'edit' || isRunning) return;
    
    const updatedNodes = graph.nodes.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    );
    
    onGraphChange({
      nodes: updatedNodes,
      edges: [...graph.edges]
    });
  };
  
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    if (mode !== 'edit' || isRunning) return;
    
    // Check if it's a start or end node
    if (nodeId === startNodeId || nodeId === endNodeId) {
      toast.error("Cannot remove start or end node");
      return;
    }
    
    // Remove the node and any connected edges
    const nodeToRemove = graph.nodes.find(n => n.id === nodeId);
    const updatedNodes = graph.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = graph.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    onGraphChange({
      nodes: updatedNodes,
      edges: updatedEdges
    });
    
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    
    toast.info(`Node ${nodeToRemove?.label || nodeId} removed`);
  };
  
  const handleEdgeContextMenu = (e: React.MouseEvent, edgeId: string) => {
    e.preventDefault();
    if (mode !== 'edit' || isRunning) return;
    
    // Get edge details for feedback
    const edge = graph.edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    
    // Remove the edge
    const updatedEdges = graph.edges.filter(edge => edge.id !== edgeId);
    
    onGraphChange({
      nodes: [...graph.nodes],
      edges: updatedEdges
    });
    
    toast.info(`Edge from ${sourceNode?.label || edge.source} to ${targetNode?.label || edge.target} removed`);
  };
  
  const getNodeColor = (node: Node) => {
    if (node.id === startNodeId) return 'fill-node-start';
    if (node.id === endNodeId) return 'fill-node-end';
    
    switch (node.status) {
      case 'visited': return 'fill-node-visited';
      case 'current': return 'fill-node-current';
      case 'path': return 'fill-node-path';
      default: return 'fill-node';
    }
  };
  
  const getEdgeColor = (edge: Edge) => {
    return edge.status === 'path' ? 'stroke-edge-path' : 'stroke-edge';
  };
  
  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-white rounded-lg border border-gray-100 shadow-sm"
      onClick={handleCanvasClick}
    >
      <svg className="w-full h-full">
        {/* Edges */}
        {graph.edges.map(edge => {
          const sourceNode = graph.nodes.find(n => n.id === edge.source);
          const targetNode = graph.nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          const midpoint = findEdgeMidpoint(sourceNode, targetNode);
          
          return (
            <g key={edge.id} onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                className={`edge ${getEdgeColor(edge)} stroke-2 hover:stroke-3 transition-all`}
              />
              <text
                x={midpoint.x}
                y={midpoint.y}
                dy="-5"
                className="edge-weight fill-gray-600 text-xs font-medium"
                textAnchor="middle"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}
        
        {/* Nodes */}
        {graph.nodes.map(node => (
          <g 
            key={node.id}
            onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (selectingForAlgorithm) {
                handleNodeSelectionForAlgorithm(node.id);
              }
            }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={selectedNode === node.id ? 22 : 20}
              className={`node ${getNodeColor(node)} stroke-2 ${
                selectedNode === node.id
                  ? 'stroke-black/30'
                  : node.id === startNodeId || node.id === endNodeId
                  ? 'stroke-black/20'
                  : 'stroke-gray-200'
              }`}
            />
            <text
              x={node.x}
              y={node.y}
              className="node-label fill-gray-800 text-xs font-medium"
              textAnchor="middle"
              dy="0.3em"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Edge Weight Popover */}
      {pendingEdge && (
        <div 
          className="absolute"
          style={{ 
            left: `${popoverPosition.x}px`, 
            top: `${popoverPosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="w-6 h-6 opacity-0">Trigger</div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white shadow-lg rounded-lg border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm flex items-center">
                    <Weight className="h-4 w-4 mr-2" /> Set Edge Weight
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">1</span>
                  <Slider
                    value={[edgeWeight]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(value) => setEdgeWeight(value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm">20</span>
                </div>
                <div className="text-center text-lg font-bold">{edgeWeight}</div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={cancelEdgeCreation}>Cancel</Button>
                  <Button size="sm" onClick={confirmEdgeCreation}>Confirm</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* Instructions */}
      {mode === 'edit' && !isRunning && graph.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 rounded-lg bg-white/60 backdrop-blur-sm max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Graph</h3>
            <p className="text-gray-600 text-sm mb-3">
              Click anywhere to add nodes. Click a node then another to create an edge. 
              Right-click to remove a node or edge.
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
              Start by creating a few nodes
            </div>
          </div>
        </div>
      )}
      
      {/* Node selection mode indicator */}
      {selectingForAlgorithm && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
            Select {nodeSelectionPurpose === 'start' ? 'start' : 'end'} node
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
