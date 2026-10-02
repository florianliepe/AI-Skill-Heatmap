import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  applyNodeChanges,
  type Node,
  type NodeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Workspace, CanvasNode, CanvasEdge } from "./types";
function TargetNode({
  data,
}: {
  data: { label: string; category: string; mode: string; owner: string };
}) {
  return (
    <div className="target-node">
      <Handle type="target" position={Position.Left} />
      <span className="node-category">{data.category}</span>
      <strong>{data.label}</strong>
      <span className="node-mode">{data.mode}</span>
      <small>{data.owner || "Owner to be assigned"}</small>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { target: TargetNode };
export default function TargetCanvas({
  data,
  busy,
  onEdit,
  onMove,
  onConnect,
  onEdge,
}: {
  data: Workspace;
  busy: boolean;
  onEdit: (n: CanvasNode) => void;
  onMove: (n: CanvasNode) => Promise<void>;
  onConnect: (e: CanvasEdge) => Promise<void>;
  onEdge: (e: CanvasEdge) => void;
}) {
  const makeNodes = () =>
    data.nodes.map((n) => ({
      id: n.id,
      type: "target",
      position: { x: n.x, y: n.y },
      data: { ...n },
    }));
  const [nodes, setNodes] = useState<Node[]>(makeNodes);
  useEffect(() => setNodes(makeNodes()), [data.nodes]);
  const onChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );
  const edges = data.edges.map((e) => ({
    ...e,
    type: "smoothstep",
    style: { stroke: "#79938a", strokeWidth: 2 },
    labelStyle: { fill: "#526861", fontSize: 11 },
  }));
  return (
    <div className="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onChange}
        nodesDraggable={!busy}
        nodesConnectable={!busy}
        deleteKeyCode={null}
        onNodeDoubleClick={(_, n) => {
          const r = data.nodes.find((x) => x.id === n.id);
          if (r) onEdit(r);
        }}
        onEdgeDoubleClick={(_, e) => {
          const r = data.edges.find((x) => x.id === e.id);
          if (r) onEdge(r);
        }}
        onNodeDragStop={async (_, n) => {
          const r = data.nodes.find((x) => x.id === n.id);
          if (r)
            try {
              await onMove({
                ...r,
                x: Math.round(n.position.x),
                y: Math.round(n.position.y),
              });
            } catch {
              setNodes(makeNodes());
            }
        }}
        onConnect={(c: Connection) => {
          if (c.source && c.target)
            void onConnect({
              id: crypto.randomUUID(),
              source: c.source,
              target: c.target,
              label: "",
            });
        }}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
      >
        <Background color="#cbd4cb" gap={22} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#b6cfc0" maskColor="rgba(243,245,240,.65)" />
      </ReactFlow>
    </div>
  );
}
