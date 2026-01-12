export type MessageRole = 'user' | 'model';
export type FeedbackStatus = 'liked' | 'disliked' | null;
 
// --- Tool Types ---
export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'running' | 'completed' | 'error';
  result?: string;
}
 
// --- Artifact Types ---
export interface TestCase {
  id: string;
  description: string;
  steps: string[];
  expectedResult: string;
}
 
export interface TestCaseArtifact {
  artifactType: 'testCases';
  title: string;
  testCases: TestCase[];
}
 
export interface ProjectPlanTask {
  id: string;
  taskName: string;
  description: string;
  dueDate: string;
}
 
export interface ProjectPlanArtifact {
  artifactType: 'projectPlan';
  title: string;
  objective: string;
  tasks: ProjectPlanTask[];
}
 
export type Artifact = TestCaseArtifact | ProjectPlanArtifact;
 
// --- Message Types ---
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  image?: { data: string; mimeType: string } | null;
  feedback?: FeedbackStatus;
  artifact?: Artifact;
  isGeneratingArtifact?: boolean;
 
  // New Fields for Tool Approval
  toolCalls?: ToolCall[];
  isWaitingForApproval?: boolean;
}
 
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
 
export interface MCPResource {
  connection_id: string;
  name: string;
  uri: string;
  mimeType: string;
  description?: string;
}
 
export interface MCPPrompt {
  connection_id: string;
  name: string;
  description?: string;
  arguments: { name: string; required: boolean }[];
}