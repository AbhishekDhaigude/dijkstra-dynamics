
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import GraphCanvas from '@/components/GraphCanvas';
import ControlPanel from '@/components/ControlPanel';
import InfoPanel from '@/components/InfoPanel';
import { 
  Graph, 
  generateDemoGraph,
  resetGraphStatus 
} from '@/utils/graphUtils';
import { 
  DijkstraStep, 
  DijkstraResult,
  runDijkstraAlgorithm 
} from '@/utils/dijkstra';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Index = () => {
  // Graph state
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [editorMode, setEditorMode] = useState<'edit' | 'view'>('edit');
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [endNodeId, setEndNodeId] = useState<string | null>(null);
  const [selectingStartNode, setSelectingStartNode] = useState(false);
  const [selectingEndNode, setSelectingEndNode] = useState(false);
  
  // Algorithm state
  const [isRunning, setIsRunning] = useState(false);
  const [algorithmSteps, setAlgorithmSteps] = useState<DijkstraStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [result, setResult] = useState<DijkstraResult | null>(null);
  const autoRunIntervalRef = useRef<number | null>(null);
  
  // Initialize demo graph
  useEffect(() => {
    const demoGraph = generateDemoGraph();
    setGraph(demoGraph);
  }, []);
  
  // Handle node selection for start/end nodes
  const handleNodeSelection = (nodeId: string) => {
    if (selectingStartNode) {
      setStartNodeId(nodeId);
      setSelectingStartNode(false);
      toast.success(`Node ${nodeId} set as start node`);
    } else if (selectingEndNode) {
      setEndNodeId(nodeId);
      setSelectingEndNode(false);
      toast.success(`Node ${nodeId} set as end node`);
    }
  };
  
  // Start selecting start node
  const handleSelectStartNode = () => {
    setSelectingStartNode(true);
    setSelectingEndNode(false);
    toast.info("Click on a node to set as start node");
  };
  
  // Start selecting end node
  const handleSelectEndNode = () => {
    setSelectingEndNode(true);
    setSelectingStartNode(false);
    toast.info("Click on a node to set as end node");
  };
  
  // Start running the algorithm
  const startAlgorithm = () => {
    if (!startNodeId || !endNodeId) {
      toast.error("Please select both start and end nodes");
      return;
    }
    
    if (startNodeId === endNodeId) {
      toast.error("Start and end nodes must be different");
      return;
    }
    
    // Reset any previous run
    const resetGraph = resetGraphStatus(graph);
    setGraph(resetGraph);
    
    // Run the algorithm
    const result = runDijkstraAlgorithm(resetGraph, startNodeId, endNodeId);
    setResult(result);
    setAlgorithmSteps(result.steps);
    setCurrentStepIndex(0);
    setIsRunning(true);
    setEditorMode('view');
    
    // Update the graph with the initial step
    if (result.steps.length > 0) {
      setGraph(result.steps[0].graph);
    }
  };
  
  // Reset the algorithm
  const resetAlgorithm = () => {
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current);
      autoRunIntervalRef.current = null;
    }
    
    setIsRunning(false);
    setAlgorithmSteps([]);
    setCurrentStepIndex(0);
    setResult(null);
    
    // Reset the graph
    const resetGraph = resetGraphStatus(graph);
    setGraph(resetGraph);
  };
  
  // Move to the next step
  const goToNextStep = () => {
    if (currentStepIndex < algorithmSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setGraph(algorithmSteps[nextIndex].graph);
      
      if (nextIndex === algorithmSteps.length - 1) {
        toast.success("Algorithm complete!");
      }
    }
  };
  
  // Auto run the algorithm
  const autoRunAlgorithm = () => {
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current);
      autoRunIntervalRef.current = null;
      toast.info("Auto-run paused");
      return;
    }
    
    toast.info("Auto-running algorithm");
    
    autoRunIntervalRef.current = window.setInterval(() => {
      setCurrentStepIndex(prevIndex => {
        if (prevIndex < algorithmSteps.length - 1) {
          const nextIndex = prevIndex + 1;
          setGraph(algorithmSteps[nextIndex].graph);
          
          if (nextIndex === algorithmSteps.length - 1) {
            clearInterval(autoRunIntervalRef.current!);
            autoRunIntervalRef.current = null;
            toast.success("Algorithm complete!");
          }
          
          return nextIndex;
        }
        
        clearInterval(autoRunIntervalRef.current!);
        autoRunIntervalRef.current = null;
        return prevIndex;
      });
    }, 500);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
      }
    };
  }, []);
  
  const handleLoadDemoGraph = () => {
    resetAlgorithm();
    const demoGraph = generateDemoGraph();
    setGraph(demoGraph);
    setStartNodeId('A');
    setEndNodeId('E');
    toast.success("Demo graph loaded");
  };
  
  const handleClearGraph = () => {
    resetAlgorithm();
    setGraph({ nodes: [], edges: [] });
    setStartNodeId(null);
    setEndNodeId(null);
    toast.info("Graph cleared");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl flex flex-col">
        <div className="mb-8 text-center animate-slide-down">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
            Dijkstra's Algorithm Visualization
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600">
            Create your own graph or use our demo to visualize how Dijkstra's algorithm finds 
            the shortest path between nodes. Interactive, step-by-step visualization helps 
            understand the core principles of this fundamental pathfinding algorithm.
          </p>
        </div>
        
        <div className="grid md:grid-cols-7 gap-6 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Graph Canvas - Larger area */}
          <div className="md:col-span-5 h-[500px] bg-white/50 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm p-1">
            <GraphCanvas 
              graph={graph}
              onGraphChange={setGraph}
              mode={editorMode}
              startNodeId={startNodeId}
              endNodeId={endNodeId}
              onSelectNode={handleNodeSelection}
              isRunning={isRunning}
            />
          </div>
          
          {/* Control Panel */}
          <div className="md:col-span-2 flex flex-col">
            <ControlPanel 
              className="mb-6 flex-shrink-0"
              isRunning={isRunning}
              canRun={!!startNodeId && !!endNodeId}
              onStartAlgorithm={startAlgorithm}
              onResetAlgorithm={resetAlgorithm}
              onNextStep={goToNextStep}
              onAutoRun={autoRunAlgorithm}
              currentStep={currentStepIndex + 1}
              totalSteps={algorithmSteps.length}
              startNodeId={startNodeId}
              endNodeId={endNodeId}
              onSelectStartNode={handleSelectStartNode}
              onSelectEndNode={handleSelectEndNode}
              editorMode={editorMode}
              setEditorMode={setEditorMode}
            />
            
            <InfoPanel 
              className="flex-1"
              currentStep={algorithmSteps[currentStepIndex] || null}
              shortestPath={result?.shortestPath || null}
              shortestDistance={result?.shortestDistance || null}
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            variant="outline" 
            onClick={handleLoadDemoGraph}
            disabled={isRunning}
          >
            Load Demo Graph
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearGraph}
            disabled={isRunning}
          >
            Clear Graph
          </Button>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p>
          Dijkstra Dynamics • Built with React and D3 • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Index;
