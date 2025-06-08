
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { Upload, Download, RefreshCw, MessageSquare, Calendar, User } from 'lucide-react';

interface ExportData {
  exportMetadata: {
    userId: string;
    exportDate: string;
    timeframe: string;
    totalConversations: number;
    version: string;
  };
  conversations: Array<{
    thread: any;
    exchanges: any[];
  }>;
}

export default function ConversationRestore() {
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      
      // Validate the export data structure
      if (!data.exportMetadata || !data.conversations) {
        throw new Error('Invalid export file format');
      }

      setExportData(data);
      setSelectedConversations([]); // Reset selection
      
      toast({
        title: "Export File Loaded",
        description: `Found ${data.conversations.length} conversations from ${new Date(data.exportMetadata.exportDate).toLocaleDateString()}`,
      });
    } catch (error) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid conversation export file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleConversationToggle = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId) 
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSelectAll = () => {
    if (!exportData) return;
    
    if (selectedConversations.length === exportData.conversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(exportData.conversations.map((_, index) => index.toString()));
    }
  };

  const handleRestore = async () => {
    if (!exportData || selectedConversations.length === 0) {
      toast({
        title: "No Conversations Selected",
        description: "Please select conversations to restore.",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const conversationsToRestore = selectedConversations.map(index => 
        exportData.conversations[parseInt(index)]
      );

      const response = await fetch('/api/therapeutic-chat/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exportData,
          selectedConversations: conversationsToRestore
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restore conversations');
      }

      const result = await response.json();
      
      toast({
        title: "Conversations Restored",
        description: `Successfully restored ${result.restoredCount} conversations to your dashboard.`,
      });

      // Refresh the conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
      
      // Reset the form
      setExportData(null);
      setSelectedConversations([]);
      
    } catch (error) {
      toast({
        title: "Restoration Failed",
        description: "Failed to restore conversations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Restore Conversations</h1>
          <p className="text-muted-foreground">
            Upload your exported conversation file to restore them back to your dashboard
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Export File
            </CardTitle>
            <CardDescription>
              Select the JSON file you downloaded when exporting your conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessingFile}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {isProcessingFile ? 'Processing file...' : 'Choose export file'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JSON files from conversation exports
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Export Data Preview */}
        {exportData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Export File Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {exportData.conversations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {exportData.exportMetadata.timeframe}
                  </div>
                  <div className="text-sm text-muted-foreground">Timeframe</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {new Date(exportData.exportMetadata.exportDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Export Date</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">v{exportData.exportMetadata.version}</div>
                  <div className="text-sm text-muted-foreground">Version</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Conversations to Restore</h3>
                <Button variant="outline" onClick={handleSelectAll}>
                  {selectedConversations.length === exportData.conversations.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exportData.conversations.map((conversation, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedConversations.includes(index.toString())}
                      onCheckedChange={() => handleConversationToggle(index.toString())}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{conversation.thread.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {conversation.exchanges?.length || 0} exchanges
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(conversation.thread.createdAt).toLocaleDateString()}
                        </div>
                        {conversation.thread.currentEmotionalState && (
                          <Badge variant="outline" className="text-xs">
                            {conversation.thread.currentEmotionalState}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedConversations.length} of {exportData.conversations.length} conversations selected
                </div>
                <Button 
                  onClick={handleRestore}
                  disabled={selectedConversations.length === 0 || isRestoring}
                  className="flex items-center gap-2"
                >
                  {isRestoring ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isRestoring ? 'Restoring...' : 'Restore Selected'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
