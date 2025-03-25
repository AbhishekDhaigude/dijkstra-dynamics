
import { Graph, Node, Edge, createAdjacencyList } from './graphUtils';

export interface DijkstraStep {
  distances: Map<string, number>;
  previous: Map<string, string | null>;
  currentNode: string | null;
  visitedNodes: Set<string>;
  unvisitedNodes: Set<string>;
  graph: Graph;
  isDone: boolean;
  shortestPath: string[] | null;
}

export interface DijkstraResult {
  success: boolean;
  steps: DijkstraStep[];
  shortestPath: string[] | null;
  shortestDistance: number | null;
}

export const initializeDijkstra = (graph: Graph, startNodeId: string): DijkstraStep => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisitedNodes = new Set<string>();
  const visitedNodes = new Set<string>();
  
  // Initialize all distances to Infinity except the start node
  graph.nodes.forEach(node => {
    distances.set(node.id, node.id === startNodeId ? 0 : Infinity);
    previous.set(node.id, null);
    unvisitedNodes.add(node.id);
  });
  
  return {
    distances,
    previous,
    currentNode: startNodeId,
    visitedNodes,
    unvisitedNodes,
    graph: {
      nodes: graph.nodes.map(node => ({
        ...node,
        status: node.id === startNodeId ? 'start' : node.status === 'end' ? 'end' : 'default'
      })),
      edges: [...graph.edges]
    },
    isDone: false,
    shortestPath: null
  };
};

export const dijkstraNextStep = (prevStep: DijkstraStep): DijkstraStep => {
  // Clone the previous step to avoid mutation
  const currentStep: DijkstraStep = {
    distances: new Map(prevStep.distances),
    previous: new Map(prevStep.previous),
    currentNode: prevStep.currentNode,
    visitedNodes: new Set(prevStep.visitedNodes),
    unvisitedNodes: new Set(prevStep.unvisitedNodes),
    graph: {
      nodes: [...prevStep.graph.nodes],
      edges: [...prevStep.graph.edges]
    },
    isDone: prevStep.isDone,
    shortestPath: prevStep.shortestPath
  };
  
  // If algorithm is already done or there's no current node, return as is
  if (currentStep.isDone || !currentStep.currentNode) {
    return currentStep;
  }
  
  const adjacencyList = createAdjacencyList(prevStep.graph);
  const currentNodeId = currentStep.currentNode;
  
  // Mark current node as visited
  currentStep.visitedNodes.add(currentNodeId);
  currentStep.unvisitedNodes.delete(currentNodeId);
  
  // Update the status of the current node in the graph
  currentStep.graph.nodes = currentStep.graph.nodes.map(node => ({
    ...node,
    status: node.id === currentNodeId 
      ? (node.status === 'start' ? 'start' : 'current') 
      : (currentStep.visitedNodes.has(node.id) 
          ? (node.status === 'end' ? 'end' : 'visited') 
          : node.status)
  }));
  
  // Get neighbors of the current node
  const neighbors = adjacencyList.get(currentNodeId) || [];
  const currentDistance = currentStep.distances.get(currentNodeId) || 0;
  
  // Update distances to all neighbors
  neighbors.forEach(({ node: neighborId, weight }) => {
    if (currentStep.visitedNodes.has(neighborId)) return;
    
    const newDistance = currentDistance + weight;
    const existingDistance = currentStep.distances.get(neighborId) || Infinity;
    
    if (newDistance < existingDistance) {
      currentStep.distances.set(neighborId, newDistance);
      currentStep.previous.set(neighborId, currentNodeId);
    }
  });
  
  // Find the next unvisited node with the smallest distance
  let smallestDistance = Infinity;
  let nextNode: string | null = null;
  
  currentStep.unvisitedNodes.forEach(nodeId => {
    const distance = currentStep.distances.get(nodeId) || Infinity;
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nextNode = nodeId;
    }
  });
  
  // If there's no next node or the smallest distance is infinity, we're done
  if (nextNode === null || smallestDistance === Infinity) {
    currentStep.isDone = true;
    currentStep.currentNode = null;
  } else {
    currentStep.currentNode = nextNode;
  }
  
  return currentStep;
};

export const constructPath = (
  endNodeId: string, 
  previous: Map<string, string | null>
): string[] | null => {
  const path: string[] = [];
  let current: string | null = endNodeId;
  
  // If there's no path to the end node, return null
  if (!previous.has(endNodeId) || previous.get(endNodeId) === null && endNodeId !== [...previous.keys()][0]) {
    return null;
  }
  
  // Construct the path by backtracking from the end node
  while (current) {
    path.unshift(current);
    current = previous.get(current) || null;
  }
  
  return path;
};

export const visualizeShortestPath = (
  graph: Graph, 
  path: string[]
): Graph => {
  if (!path || path.length < 2) return graph;
  
  const newGraph = { 
    nodes: [...graph.nodes],
    edges: [...graph.edges]
  };
  
  // Update node statuses
  newGraph.nodes = newGraph.nodes.map(node => ({
    ...node,
    status: node.status === 'start' || node.status === 'end' 
      ? node.status 
      : path.includes(node.id) ? 'path' : node.status
  }));
  
  // Update edge statuses
  newGraph.edges = newGraph.edges.map(edge => {
    // Check if this edge is part of the path
    const isPathEdge = path.some((nodeId, index) => {
      if (index === path.length - 1) return false;
      const nextNodeId = path[index + 1];
      return (edge.source === nodeId && edge.target === nextNodeId) || 
             (edge.source === nextNodeId && edge.target === nodeId);
    });
    
    return {
      ...edge,
      status: isPathEdge ? 'path' : edge.status
    };
  });
  
  return newGraph;
};

export const runDijkstraAlgorithm = (
  graph: Graph, 
  startNodeId: string, 
  endNodeId: string
): DijkstraResult => {
  // Initial setup
  let currentStep = initializeDijkstra(graph, startNodeId);
  const steps: DijkstraStep[] = [currentStep];
  
  // Run the algorithm until completion
  while (!currentStep.isDone) {
    currentStep = dijkstraNextStep(currentStep);
    steps.push({...currentStep});
  }
  
  // Construct the path
  const shortestPath = constructPath(endNodeId, currentStep.previous);
  
  // Highlight the shortest path in the final graph
  if (shortestPath && shortestPath.length > 0) {
    const finalGraph = visualizeShortestPath(currentStep.graph, shortestPath);
    steps[steps.length - 1].graph = finalGraph;
    steps[steps.length - 1].shortestPath = shortestPath;
  }
  
  return {
    success: !!shortestPath,
    steps,
    shortestPath,
    shortestDistance: currentStep.distances.get(endNodeId) || null
  };
};
