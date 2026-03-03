import { ReactFlow, Controls, Background, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '../../store/useProjectStore';
import StoryNode from './StoryNode';
import ConditionNode from './ConditionNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
  storyNode: StoryNode,
  conditionNode: ConditionNode,
};

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
};

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useProjectStore();

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
