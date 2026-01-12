import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MCPResource, MCPPrompt } from '../components/chat/types';
 
interface MCPConnection {
  id: string;
  target: string;
  type: 'stdio' | 'sse' | 'http';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  toolCount: number;
  error?: string;
}
 
interface MCPState {
  connections: MCPConnection[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
 
  connectServer: (id: string, target: string, type: 'stdio' | 'sse' | 'http') => Promise<void>;
  disconnectServer: (id: string) => Promise<void>;
  fetchStatus: () => Promise<void>;
  fetchCapabilities: () => Promise<void>;
}
 
export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      connections: [],
      resources: [],
      prompts: [],
 
      fetchStatus: async () => {
        try {
          const res = await fetch('/api/mcp/status'); // Relative
          await res.json();
          get().fetchCapabilities();
        } catch (e) {
          console.error("Failed to fetch status", e);
        }
      },
 
      fetchCapabilities: async () => {
        try {
          const [resResources, resPrompts] = await Promise.all([
            fetch('/api/mcp/resources/list'),
            fetch('/api/mcp/prompts/list')
          ]);
         
          const resourcesData = await resResources.json();
          const promptsData = await resPrompts.json();
 
          set({
            resources: resourcesData.resources || [],
            prompts: promptsData.prompts || []
          });
        } catch (e) {
          console.error("Failed to fetch capabilities", e);
        }
      },
 
      connectServer: async (id, target, type) => {
        set((state) => ({
          connections: [
            ...state.connections.filter((c) => c.id !== id),
            { id, target, type, status: 'connecting', toolCount: 0 },
          ],
        }));
 
        try {
          const res = await fetch('/api/mcp/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, target, type }),
          });
 
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText);
          }
 
          const data = await res.json();
 
          set((state) => ({
            connections: state.connections.map((c) =>
              c.id === id
                ? { ...c, status: 'connected', toolCount: data.tools, error: undefined }
                : c
            ),
          }));
         
          get().fetchCapabilities();
 
        } catch (e: any) {
          set((state) => ({
            connections: state.connections.map((c) =>
              c.id === id
                ? { ...c, status: 'error', error: e.message || 'Connection Failed' }
                : c
            ),
          }));
        }
      },
 
      disconnectServer: async (id) => {
        try {
          await fetch(`/api/mcp/disconnect/${id}`, { method: 'POST' });
        } catch (e) {
          console.warn('Backend disconnect failed, removing locally', e);
        }
 
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));
       
        get().fetchCapabilities();
      },
    }),
    {
      name: 'mcp-connection-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connections: state.connections.map((c) =>
          c.status === 'connecting' ? { ...c, status: 'disconnected' as const } : c
        ),
      }),
    }
  )
);