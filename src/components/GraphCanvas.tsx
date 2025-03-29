
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
  
  // Force the popover to open when pendingEdge is set
  useEffect(() => {
    if (pendingEdge) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setPopoverOpen(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [pendingEdge]);
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== 'edit' || isRunning) return;
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = findNodeAt(graph.nodes, x, y);
    
    if (clickedNode) {
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
        } else {
          toast.info("Edge already exists between these nodes");
          setSelectedNode(null);
        }
      } else {
        // Select this node
        setSelectedNode(clickedNode.id);
        onSelectNode(clickedNode.id);
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
    }
  };
  
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
    
    toast.success(`Edge created with weight ${edgeWeight}`);
    setPendingEdge(null);
    setSelectedNode(null);
    setPopoverOpen(false);
  };
  
  const cancelEdgeCreation = () => {
    setPendingEdge(null);
    setSelectedNode(null);
    setPopoverOpen(false);
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
    
    // Remove the node and any connected edges
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
    
    toast.info("Node removed");
  };
  
  const handleEdgeContextMenu = (e: React.MouseEvent, edgeId: string) => {
    e.preventDefault();
    if (mode !== 'edit' || isRunning) return;
    
    // Remove the edge
    const updatedEdges = graph.edges.filter(edge => edge.id !== edgeId);
    
    onGraphChange({
      nodes: [...graph.nodes],
      edges: updatedEdges
    });
    
    toast.info("Edge removed");
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
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        {/* Using a dummy div as trigger since we control open state programmatically */}
        <PopoverTrigger asChild>
          <div className="hidden">Trigger</div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Set Edge Weight</h3>
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
    </div>
  );
};

export default GraphCanvas;
