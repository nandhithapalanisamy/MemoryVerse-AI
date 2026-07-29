import React, { useState, useEffect, useRef } from 'react';
import { FiGitBranch, FiRefreshCw, FiZap } from 'react-icons/fi';
import { aiAPI } from '../services/api';

function KnowledgeGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Custom force layout state
  const [nodes, setNodes] = useState([]);
  const svgRef = useRef(null);
  const [draggedNode, setDraggedNode] = useState(null);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getKnowledgeGraph();
      // Initialize node coordinates in a circular layout or grid
      const rawNodes = res.data.nodes || [];
      const initializedNodes = rawNodes.map((node, idx) => {
        const angle = (idx / (rawNodes.length || 1)) * 2 * Math.PI;
        const radius = 180 + Math.random() * 40;
        return {
          ...node,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
        };
      });
      
      // Let's position the "Career Ready" goal in the center
      const centerNode = initializedNodes.find(n => n.type === 'Goal');
      if (centerNode) {
        centerNode.x = 400;
        centerNode.y = 300;
      }

      setNodes(initializedNodes);
      setGraphData({ nodes: initializedNodes, edges: res.data.edges || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (nodeId, e) => {
    setDraggedNode(nodeId);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !svgRef.current) return;
    
    // Get local coordinates inside SVG
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNodes(prev => prev.map(node => {
      if (node.id === draggedNode) {
        return { ...node, x, y };
      }
      return node;
    }));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Node Color helpers based on types
  const getNodeColor = (type) => {
    switch (type) {
      case 'Skill': return { bg: '#06b6d4', text: '#ecfeff', border: '#0891b2' }; // Cyan
      case 'Certificate': return { bg: '#a855f7', text: '#faf5ff', border: '#9333ea' }; // Purple
      case 'Project': return { bg: '#3b82f6', text: '#eff6ff', border: '#2563eb' }; // Blue
      case 'Internship': return { bg: '#10b981', text: '#ecfdf5', border: '#059669' }; // Green
      case 'Goal': return { bg: '#f97316', text: '#fff7ed', border: '#ea580c' }; // Orange
      default: return { bg: '#64748b', text: '#f8fafc', border: '#475569' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center border-b border-indigo-950/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Knowledge Graph</h1>
          <p className="text-sm text-slate-400">Interactive visual journey showing connections between your certificates, projects, and skills</p>
        </div>
        <button 
          onClick={fetchGraph} 
          className="p-2.5 bg-indigo-950 border border-indigo-900 rounded-xl text-xs text-indigo-300 hover:bg-indigo-900 transition flex items-center"
        >
          <FiRefreshCw className="mr-1.5" /> Re-layout
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* SVG Drawing Canvas */}
        <div className="lg:col-span-3 glass-panel rounded-3xl border border-indigo-950/40 overflow-hidden relative min-h-[500px]">
          
          <div className="absolute top-4 left-4 flex flex-wrap gap-3 text-xs bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-900/30">
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-cyan-500"></div><span className="text-slate-300">Skills</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-slate-300">Certificates</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-300">Projects</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-300">Internships</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-slate-300">Goals</span></div>
          </div>

          <svg 
            ref={svgRef}
            width="100%"
            height="600"
            viewBox="0 0 800 600"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-grab active:cursor-grabbing"
          >
            {/* Arrow Marker Definitions */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4338ca" />
              </marker>
            </defs>

            {/* Links/Edges */}
            {graphData.edges.map((edge, idx) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;

              // Draw curves
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const dr = Math.sqrt(dx * dx + dy * dy);
              
              // Curve definition
              const pathD = `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;

              return (
                <g key={`edge-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(99, 102, 241, 0.25)"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow)"
                  />
                  <text 
                    x={(sourceNode.x + targetNode.x) / 2} 
                    y={(sourceNode.y + targetNode.y) / 2 - 5}
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const colors = getNodeColor(node.type);
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              
              return (
                <g 
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node.id)}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  className="transition-transform duration-100 ease-out"
                >
                  {/* Glowing background on hover */}
                  <circle
                    r={isHovered ? 26 : 22}
                    fill={colors.bg}
                    stroke={colors.border}
                    strokeWidth={isSelected ? "3" : "1.5"}
                    className="transition-all cursor-pointer shadow-lg"
                    style={{ filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.8))' : 'none' }}
                  />
                  
                  {/* Node Icon/First letter */}
                  <text
                    dy=".3em"
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.label.charAt(0).toUpperCase()}
                  </text>

                  {/* Label Text below node */}
                  <text
                    y="36"
                    textAnchor="middle"
                    fill={isHovered ? "#fff" : "rgba(255, 255, 255, 0.75)"}
                    fontSize="9.5"
                    fontWeight={isHovered ? "bold" : "medium"}
                    className="pointer-events-none select-none bg-black/20"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-indigo-950/40 flex flex-col space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider pb-2 border-b border-indigo-950 flex items-center">
            <FiZap className="mr-2 text-indigo-400" /> Node Inspector
          </h3>
          
          <div className="flex-1">
            {selectedNode ? (
              (() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                const colors = getNodeColor(node.type);
                
                // Find adjacent edges
                const connections = graphData.edges.filter(
                  e => e.source === node.id || e.target === node.id
                );

                return (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: colors.bg, color: colors.text }}>
                        {node.type}
                      </span>
                      <h4 className="text-lg font-bold text-slate-100 mt-1">{node.label}</h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-400">Direct Connections ({connections.length})</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {connections.map((c, i) => {
                          const target = nodes.find(n => n.id === (c.source === node.id ? c.target : c.source));
                          return (
                            <div key={i} className="p-2 rounded bg-indigo-950/20 border border-indigo-950 flex justify-between">
                              <span className="text-slate-400">{c.label}</span>
                              <span className="font-bold text-slate-200">{target?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-slate-500 text-center py-12">Click a node in the graph to inspect its details and relationships.</p>
            )}
          </div>
          
          <div className="text-[10px] text-slate-500 bg-indigo-950/10 p-2.5 rounded-xl border border-indigo-950/20 leading-relaxed">
            💡 **Tip:** You can click and drag nodes to custom layout them. Curved arrows illustrate how certifications and skills enable projects!
          </div>
        </div>

      </div>

    </div>
  );
}

export default KnowledgeGraph;
