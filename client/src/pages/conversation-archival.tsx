
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, Upload, Archive, Restore, AlertCircle, CheckCircle } from 'lucide-react';

interface ArchiveRecord {
  id: string;
  filename: string;
  conversationCount: number;
  archivedAt: string;
  isRestored: boolean;
}

export default function ConversationArchivalPage() {
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(6);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await fetch('/api/conversations/archives', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setArchives(data.archives);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/conversations/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          olderThanMonths: selectedMonths
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully archived ${data.conversationsArchived} conversations to BunnyCDN`
        });
        fetchArchives(); // Refresh archives list
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Archival failed'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to archive conversations'
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (archiveId: string) => {
    setIsRestoring(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/conversations/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          archiveId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully restored ${data.conversationsRestored} conversations from archive`
        });
        fetchArchives(); // Refresh archives list
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Restoration failed'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to restore conversations'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conversation Archive Management</h1>
        <p className="text-muted-foreground">
          Archive old conversations to BunnyCDN storage and restore them when needed. 
          This helps keep your active conversations organized while preserving your history.
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archive Old Conversations
            </CardTitle>
            <CardDescription>
              Move conversations older than a specified time to BunnyCDN storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Archive conversations older than:</label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>1 year</option>
                <option value={24}>2 years</option>
              </select>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-medium text-blue-900 mb-1">What happens during archival:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Conversations are exported to JSON format</li>
                <li>• Files are securely uploaded to BunnyCDN</li>
                <li>• Original conversations are removed from active database</li>
                <li>• You can restore them anytime</li>
              </ul>
            </div>

            <Button 
              onClick={handleArchive}
              disabled={isArchiving}
              className="w-full"
            >
              {isArchiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Archiving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Archive Old Conversations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Restore className="h-5 w-5" />
              Available Archives
            </CardTitle>
            <CardDescription>
              Restore archived conversations back to your active dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {archives.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No archived conversations found</p>
                <p className="text-sm">Archive some conversations to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archives.map((archive) => (
                  <div key={archive.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Archive {archive.id.slice(-8)}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(archive.archivedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={archive.isRestored ? "secondary" : "default"}>
                        {archive.conversationCount} conversations
                      </Badge>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleRestore(archive.id)}
                      disabled={isRestoring || archive.isRestored}
                      className="w-full"
                    >
                      {isRestoring ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                          Restoring...
                        </>
                      ) : archive.isRestored ? (
                        "Already Restored"
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-2" />
                          Restore to Dashboard
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Archival Process</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Select conversations older than specified time</li>
                <li>2. Export to JSON format with full conversation history</li>
                <li>3. Upload securely to BunnyCDN storage</li>
                <li>4. Remove from active database to save space</li>
                <li>5. Create archive record for easy restoration</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Restoration Process</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Download archive file from BunnyCDN</li>
                <li>2. Parse JSON and validate data integrity</li>
                <li>3. Recreate conversations in database</li>
                <li>4. Maintain original timestamps and content</li>
                <li>5. Mark conversations as restored</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
