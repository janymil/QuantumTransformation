import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Plus, Trash2 } from "lucide-react";
import { ConversationSession } from "./types";

interface ChatSidebarProps {
  savedSessions: ConversationSession[];
  activeSession: ConversationSession | null;
  onSessionSelect: (session: ConversationSession) => void;
  onSessionDelete: (sessionId: number) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ 
  savedSessions, 
  activeSession, 
  onSessionSelect, 
  onSessionDelete, 
  onNewChat 
}: ChatSidebarProps) {
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Therapeutic Chat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered therapeutic companion</p>
          </div>
        </div>
        
        <Button 
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Sessions</h2>
        </div>
        
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {savedSessions.map((session) => (
              <div 
                key={session.id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                  activeSession?.id === session.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {session.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionDelete(session.id);
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}