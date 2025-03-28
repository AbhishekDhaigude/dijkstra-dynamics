
// Graph data structures
export interface Node {
  id: string;
  x: number;
  y: number;
  label?: string;
  status?: 'default' | 'visited' | 'current' | 'start' | 'end' | 'path';
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
  status?: 'default' | 'path';
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// Calculate distance between two points
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Find a node at specific coordinates (with a tolerance)
export const findNodeAt = (nodes: Node[], x: number, y: number, tolerance = 20): Node | undefined => {
  return nodes.find(node => calculateDistance(node.x, node.y, x, y) <= tolerance);
};

// Check if an edge already exists between two nodes
export const edgeExists = (edges: Edge[], sourceId: string, targetId: string): boolean => {
  return edges.some(
    edge => 
      (edge.source === sourceId && edge.target === targetId) || 
      (edge.source === targetId && edge.target === sourceId)
  );
};

// Generate the next letter label based on existing nodes
export const getNextLetterLabel = (nodes: Node[]): string => {
  if (nodes.length === 0) return 'A';
  
  // Get all existing letter labels
  const existingLabels = nodes.map(node => node.label || '');
  
  // Find the highest letter used
  let highestChar = 'A';
  existingLabels.forEach(label => {
    if (label && label.length === 1 && label >= 'A' && label <= 'Z' && label > highestChar) {
      highestChar = label;
    }
  });
  
  // Get the next letter in sequence
  const nextCharCode = highestChar.charCodeAt(0) + 1;
  // If we've gone beyond 'Z', loop back to 'A'
  return nextCharCode <= 90 ? String.fromCharCode(nextCharCode) : 'A';
};

// Create a new node
export const createNode = (x: number, y: number, label?: string): Node => {
  const id = generateId();
  const nodeLabel = label || getNextLetterLabel([]);
  
  return {
    id,
    x,
    y,
    label: nodeLabel,
    status: 'default'
  };
};

// Find the midpoint of an edge for placing the weight label
export const findEdgeMidpoint = (sourceNode: Node, targetNode: Node): { x: number, y: number } => {
  return {
    x: (sourceNode.x + targetNode.x) / 2,
    y: (sourceNode.y + targetNode.y) / 2
  };
};

// Reset all node and edge statuses
export const resetGraphStatus = (graph: Graph): Graph => {
  return {
    nodes: graph.nodes.map(node => ({
      ...node,
      status: node.status === 'start' || node.status === 'end' ? node.status : 'default'
    })),
    edges: graph.edges.map(edge => ({
      ...edge,
      status: 'default'
    }))
  };
};

// Create an adjacency list representation of the graph
export const createAdjacencyList = (graph: Graph): Map<string, Array<{node: string, weight: number}>> => {
  const adjacencyList = new Map<string, Array<{node: string, weight: number}>>();
  
  // Initialize map with empty arrays for all nodes
  graph.nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  // Add all edges
  graph.edges.forEach(edge => {
    const sourceConnections = adjacencyList.get(edge.source) || [];
    const targetConnections = adjacencyList.get(edge.target) || [];
    
    sourceConnections.push({ node: edge.target, weight: edge.weight });
    targetConnections.push({ node: edge.source, weight: edge.weight });
    
    adjacencyList.set(edge.source, sourceConnections);
    adjacencyList.set(edge.target, targetConnections);
  });
  
  return adjacencyList;
};

// Generate a simple demo graph
export const generateDemoGraph = (): Graph => {
  const nodes: Node[] = [
    { id: 'A', x: 100, y: 150, label: 'A', status: 'default' },
    { id: 'B', x: 250, y: 80, label: 'B', status: 'default' },
    { id: 'C', x: 400, y: 150, label: 'C', status: 'default' },
    { id: 'D', x: 250, y: 250, label: 'D', status: 'default' },
    { id: 'E', x: 550, y: 220, label: 'E', status: 'default' },
  ];
  
  const edges: Edge[] = [
    { id: 'A-B', source: 'A', target: 'B', weight: 4, status: 'default' },
    { id: 'A-D', source: 'A', target: 'D', weight: 3, status: 'default' },
    { id: 'B-C', source: 'B', target: 'C', weight: 5, status: 'default' },
    { id: 'B-D', source: 'B', target: 'D', weight: 2, status: 'default' },
    { id: 'C-D', source: 'C', target: 'D', weight: 1, status: 'default' },
    { id: 'C-E', source: 'C', target: 'E', weight: 6, status: 'default' },
    { id: 'D-E', source: 'D', target: 'E', weight: 8, status: 'default' },
  ];
  
  return { nodes, edges };
};
