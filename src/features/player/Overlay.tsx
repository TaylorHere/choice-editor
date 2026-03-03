import { useGameEngine } from '../../store/useRuntimeStore';
import { useProjectStore } from '../../store/useProjectStore';
import { StoryAction, Condition, Mutation, StoryNodeData } from '../../types';
import { useEffect } from 'react';

interface Props {
  currentTime: number;
  isEnded: boolean;
  setIsEnded: (ended: boolean) => void;
}

export default function Overlay({ currentTime, isEnded, setIsEnded }: Props) {
  const currentNode = useGameEngine((state) => state.currentNode);
  const variables = useGameEngine((state) => state.variables);
  const setCurrentNode = useGameEngine((state) => state.setCurrentNode);
  const setVariable = useGameEngine((state) => state.setVariable);
  
  const edges = useProjectStore((state) => state.edges);
  const nodes = useProjectStore((state) => state.nodes);

  const nodeData = (currentNode && currentNode.type === 'storyNode' ? currentNode.data : null) as StoryNodeData | null;

  // Handle Timeout Jump
  useEffect(() => {
    if (!nodeData?.actions) return;

    // Check visible actions for timeout
    nodeData.actions.forEach((action: StoryAction) => {
      if (action.timeMode === 'custom' && action.hasTimeout) {
        // Only check timeout if action is currently visible or was visible
        // Actually, we should check if currentTime > endTime
        const endTime = (action.endTime === undefined || action.endTime === 0) ? Infinity : action.endTime;
        
        // If currentTime exceeds endTime, and we haven't jumped yet (this effect runs frequently)
        
        if (currentTime > endTime && endTime !== Infinity) {
          // Find connection from the TIMEOUT handle
          // Source handle ID convention: `${action.id}-timeout`
          const timeoutConnection = edges.find(
            e => e.source === currentNode?.id && e.sourceHandle === `${action.id}-timeout`
          );

          if (timeoutConnection) {
            console.log("Timeout triggered via handle");
            
            // Apply any mutations on the timeout edge if needed (optional feature)
            if (timeoutConnection.data?.mutations) {
              (timeoutConnection.data.mutations as any[]).forEach(applyMutation);
            }

            // Use navigation helper to support Condition Nodes
            navigateToNode(timeoutConnection.target);
          }
        }
      }
    });
  }, [currentNode, currentTime, nodes, edges, setCurrentNode, setIsEnded]);

  // Handle Auto Jump actions
  useEffect(() => {
    if (!nodeData?.actions || !isEnded) return;

    // Find the first auto action
    const autoAction = nodeData.actions.find((a: StoryAction) => a.type === 'auto');
    if (autoAction) {
      // Check condition if exists
      if (autoAction.showCondition && !checkCondition(autoAction.showCondition)) {
        return;
      }

      // If there are visible buttons (e.g. onEnd buttons), delay the auto jump
      // This allows users to see the buttons or make a choice before auto-jumping
      // We check nodeData.actions directly for button types
      const hasVisibleButtons = nodeData.actions.some((a: StoryAction) => 
        a.type !== 'auto' && 
        (!a.showCondition || checkCondition(a.showCondition)) &&
        (!a.timeMode || a.timeMode === 'onEnd') // Only care about onEnd buttons here
      );

      if (hasVisibleButtons) {
        const timer = setTimeout(() => {
          handleAction(autoAction);
        }, 5000); // 5 seconds delay if buttons are present
        return () => clearTimeout(timer);
      } else {
        handleAction(autoAction);
      }
    }
  }, [isEnded, currentNode, currentTime]); // Added currentTime to dependency to ensure re-check if needed, though isEnded is key

  const checkCondition = (condition: Condition) => {
    const currentValue = variables[condition.variableId];
    // Simple comparison logic
    switch (condition.operator) {
      case '==': return currentValue == condition.value;
      case '!=': return currentValue != condition.value;
      case '>': return Number(currentValue) > Number(condition.value);
      case '<': return Number(currentValue) < Number(condition.value);
      case '>=': return Number(currentValue) >= Number(condition.value);
      case '<=': return Number(currentValue) <= Number(condition.value);
      default: return false;
    }
  };

  const applyMutation = (mutation: Mutation) => {
    const currentValue = variables[mutation.variableId];
    let newValue = currentValue;
    
    switch (mutation.operation) {
      case 'set': 
        newValue = mutation.value;
        break;
      case 'add': 
        newValue = Number(currentValue) + Number(mutation.value);
        break;
      case 'subtract':
        newValue = Number(currentValue) - Number(mutation.value);
        break;
    }
    
    setVariable(mutation.variableId, newValue);
  };

  const navigateToNode = (targetNodeId: string) => {
    // Helper function to handle traversal including Condition Nodes
    let currentNodeId = targetNodeId;
    let nextNode = nodes.find(n => n.id === currentNodeId);

    // Loop until we find a StoryNode (or hit a dead end)
    while (nextNode && nextNode.type === 'conditionNode') {
      const conditionData = nextNode.data as any; // Cast to access branches
      
      // 1. Apply node-level mutations
      if (conditionData.mutations) {
        conditionData.mutations.forEach(applyMutation);
      }

      // 2. Evaluate branches
      let matchedBranch = null;
      let fallbackBranch = null;

      if (conditionData.branches) {
        for (const branch of conditionData.branches) {
          if (branch.condition) {
            // Check explicit condition
            if (checkCondition(branch.condition)) {
              matchedBranch = branch;
              break; // Found first matching condition
            }
          } else {
            // Store as fallback (Else), but don't stop checking other conditions
            // unless we want Else to be order-dependent?
            // User requested "fallback handle ... after all upper branches returned false"
            // This implies priority: Conditions > Else
            if (!fallbackBranch) fallbackBranch = branch;
          }
        }
      }

      // If no conditional branch matched, use fallback
      if (!matchedBranch) {
        matchedBranch = fallbackBranch;
      }

      if (matchedBranch) {
        // Find edge connected to this branch
        const edge = edges.find(e => e.source === nextNode!.id && e.sourceHandle === matchedBranch.id);
        if (edge) {
          // Apply edge mutations if any (though usually logic is in node)
          if (edge.data?.mutations) {
            // edge.data.mutations is generic Record, cast needed or use helper
            // Edge mutations are array of Mutation objects
            (edge.data.mutations as any[]).forEach(applyMutation);
          }
          currentNodeId = edge.target;
          nextNode = nodes.find(n => n.id === currentNodeId);
        } else {
          console.warn("Dead end in condition node logic (no edge from branch)", matchedBranch);
          nextNode = undefined;
        }
      } else {
        console.warn("Dead end in condition node logic (no matching branch)");
        nextNode = undefined;
      }
    }

    if (nextNode && nextNode.type === 'storyNode') {
      setCurrentNode(nextNode);
      setIsEnded(false);
    }
  };

  const handleAction = (action: StoryAction) => {
    // Find connection from this action
    // In React Flow, edges link node to node, but we use sourceHandle for specific actions
    const connection = edges.find(
      e => e.source === currentNode?.id && e.sourceHandle === action.id
    );

    if (connection) {
      // Check connection conditions
      if (connection.data?.conditions) {
        const passed = (connection.data.conditions as any[]).every(checkCondition);
        if (!passed) return; // Or show feedback?
      }

      // Apply mutations
      if (connection.data?.mutations) {
        (connection.data.mutations as any[]).forEach(applyMutation);
      }

      // Jump to next node (using navigation helper)
      navigateToNode(connection.target);
    }
  };

  if (!nodeData?.actions) return null;

  // Filter actions that should be visible
  const visibleActions = nodeData.actions.filter((action: StoryAction) => {
    // Don't show auto actions as buttons
    if (action.type === 'auto') return false;

    // 1. Check conditions
    if (action.showCondition && !checkCondition(action.showCondition)) {
      return false;
    }

    // 2. Check time settings
    // Default to 'onEnd' if not specified
    const timeMode = action.timeMode || 'onEnd';
    
    if (timeMode === 'onEnd') {
      return isEnded;
    } else if (timeMode === 'custom') {
      const startTime = action.startTime ?? 0;
      // If endTime is 0 or undefined, treat as Infinity (show until end)
      const endTime = (action.endTime === undefined || action.endTime === 0) ? Infinity : action.endTime;
      return currentTime >= startTime && currentTime <= endTime;
    }

    return true;
  });

  if (visibleActions.length === 0) return null;

  // Split actions into standard (onEnd) and custom positioned
  const standardActions = visibleActions.filter((a: StoryAction) => !a.timeMode || a.timeMode === 'onEnd');
  const customActions = visibleActions.filter((a: StoryAction) => a.timeMode === 'custom');

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Standard Actions (Bottom Center) */}
      {standardActions.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end pb-20 items-center">
          <div className="flex flex-col gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {standardActions.map((action: StoryAction) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="px-8 py-3 rounded backdrop-blur-sm border border-white/20 transition-all text-lg font-medium shadow-lg active:scale-95"
                style={{
                  backgroundColor: action.style?.color || 'rgba(0, 0, 0, 0.6)',
                  color: action.style?.textColor || 'white',
                  borderColor: action.style?.color ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Position Actions */}
      {customActions.map((action: StoryAction) => (
        <div
          key={action.id}
          className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${action.position?.x ?? 50}%`,
            top: `${action.position?.y ?? 80}%`,
          }}
        >
          <button
            onClick={() => handleAction(action)}
            className="px-6 py-2 rounded-full backdrop-blur-sm border border-white/20 transition-all font-medium shadow-lg active:scale-95 whitespace-nowrap"
            style={{
              backgroundColor: action.style?.color || 'rgba(0, 0, 0, 0.6)',
              color: action.style?.textColor || 'white',
              borderColor: action.style?.color ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {action.label}
          </button>
        </div>
      ))}
    </div>
  );
}
