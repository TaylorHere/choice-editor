import { StoryNode, StoryEdge } from '../../types';

export interface AIConfig {
  apiKey: string;
  baseUrl?: string; // e.g. https://api.openai.com/v1
  model?: string;   // e.g. gpt-4o-mini
}

export async function generateScriptFromAI(
  prompt: string,
  config: AIConfig
): Promise<{ nodes: StoryNode[]; edges: StoryEdge[] }> {
  const systemPrompt = `
You are an Interactive Story Architect.
Convert the user's story description into a JSON structure compatible with our React Flow based editor.

Output Format:
Return ONLY a valid JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "storyNode",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Scene Name",
        "videoSrc": "optional_url",
        "isStartNode": boolean, // One node must be true
        "actions": [
          {
            "id": "action-id",
            "label": "Button Text",
            "type": "default" // or 'auto'
          }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "node-id",
      "target": "target-node-id",
      "sourceHandle": "action-id",
      "type": "default"
    }
  ]
}

Rules:
1. Ensure every node has a unique ID.
2. Ensure one node has "isStartNode": true.
3. If the user mentions "Auto Jump", use "type": "auto" for the action.
4. Position nodes reasonably (e.g. start at top left, branch out downwards/rightwards).
5. Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string.
6. Create meaningful branching paths based on the story.
`;

  try {
    const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) throw new Error("No content received from AI");

    // Clean up content (remove markdown if present despite instructions)
    const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
    
    const parsed = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) throw new Error("Invalid JSON: missing 'nodes' array");
    
    return parsed;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw error;
  }
}
