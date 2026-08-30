import React, { useState } from 'react';
import { GitBranch, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ChevronRight, ChevronDown, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

interface MindMapData {
  id: number;
  material_id: number;
  title?: string;
  material_title?: string;
  material_scope?: string;
  competency_name?: string;
  topic_name?: string;
  root_node: MindMapNode;
  version: number;
  status: string;
  created_at?: string;
}

interface MindMapViewerProps {
  materialId: number;
  materialTitle: string;
  materialScope?: string;
  competencyName?: string;
  topicName?: string;
  initialData?: MindMapData | null;
  onRegenerate: () => Promise<void>;
  onClose?: () => void;
  isGenerating?: boolean;
}

// Recursive Tree Node Component
const TreeNode: React.FC<{ node: MindMapNode; depth: number; isRoot?: boolean }> = ({
  node,
  depth,
  isRoot = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getDepthStyle = () => {
    if (isRoot) return 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-md text-base px-4 py-2.5';
    if (depth === 1) return 'bg-white text-indigo-900 border-indigo-200 font-semibold shadow-xs text-sm px-3.5 py-2';
    if (depth === 2) return 'bg-slate-50 text-slate-800 border-slate-200 font-medium text-xs px-3 py-1.5';
    return 'bg-white text-slate-700 border-slate-200 text-xs px-2.5 py-1';
  };

  return (
    <div className="flex items-start my-1.5">
      <div className="flex flex-col items-start">
        <div
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 rounded-lg border transition-all select-none ${hasChildren ? 'cursor-pointer hover:border-indigo-400' : ''} ${getDepthStyle()}`}
        >
          {hasChildren && (
            <span className="opacity-70">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          )}
          <span>{node.label}</span>
          {hasChildren && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isRoot ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {node.children!.length}
            </span>
          )}
        </div>

        {hasChildren && expanded && (
          <div className="pl-6 border-l-2 border-indigo-100 ml-4 mt-2 space-y-1">
            {node.children!.map((child, idx) => (
              <TreeNode key={idx} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  materialTitle,
  materialScope,
  competencyName,
  topicName,
  initialData,
  onRegenerate,
  onClose,
  isGenerating = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setErrorMsg(null);
    try {
      await onRegenerate();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to regenerate mind map.');
    } finally {
      setRegenerating(false);
    }
  };

  if (!initialData && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-purple-600 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-800">Constructing Concept Mind Map...</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Analyzing structural relationships and concept hierarchies grounded in your material.
        </p>
      </div>
    );
  }

  if (!initialData || !initialData.root_node) {
    return (
      <div className="text-center py-12 space-y-4">
        <GitBranch className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800">No Mind Map Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Generate an interactive conceptual hierarchy tree from "{materialTitle}".
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating || isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition shadow-sm"
        >
          {regenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Mind Map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <GitBranch className="w-3 h-3" /> Concept Mind Map
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Version {initialData.version}
              </span>
              {materialScope === 'OFFICIAL_COMPETENCY' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Official Competency
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{initialData.title || materialTitle}</h2>
          </div>

          {/* Viewport & Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 hover:bg-white rounded text-slate-700 transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 hover:bg-white rounded text-slate-700 transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="p-1.5 hover:bg-white rounded text-slate-700 transition text-xs font-medium px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={regenerating || isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating || isGenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {(competencyName || topicName) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            {competencyName && (
              <span className="bg-slate-100 px-2 py-1 rounded">
                <strong>Competency:</strong> {competencyName}
              </span>
            )}
            {topicName && (
              <span className="bg-slate-100 px-2 py-1 rounded">
                <strong>Topic:</strong> {topicName}
              </span>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Mind Map Canvas */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[380px] overflow-auto shadow-inner">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          className="transition-transform duration-150 inline-block min-w-full"
        >
          <TreeNode node={initialData.root_node} depth={0} isRoot={true} />
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Grounded directly in {initialData.material_title || materialTitle}</span>
      </div>
    </div>
  );
};
