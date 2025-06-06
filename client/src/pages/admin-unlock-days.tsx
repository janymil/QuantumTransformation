import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unlock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminUnlockDays() {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const { toast } = useToast();

  const unlockAllDays = async () => {
    try {
      setIsUnlocking(true);
      
      const response = await fetch("/api/admin/progress/unlock-all-days", {
        method: "POST",
        body: JSON.stringify({
          challengeType: "money_blocks_clearing"
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setUnlocked(true);
      toast({
        title: "Success!",
        description: "All 30 days have been unlocked for Money Blocks Clearing challenge.",
      });

      // Refresh the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Error unlocking days:", error);
      toast({
        title: "Error",
        description: "Failed to unlock days. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Unlock all challenge days for testing
          </p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-purple-600" />
              Money Blocks Clearing Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                30 Days Challenge
              </Badge>
            </div>

            <div className="text-center space-y-4">
              {unlocked ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">All Days Unlocked!</span>
                </div>
              ) : (
                <Button 
                  onClick={unlockAllDays}
                  disabled={isUnlocking}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isUnlocking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock All 30 Days
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground text-center">
              This will unlock all 30 days and mark them as accessible for your admin account.
              You'll be able to navigate to any day directly.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}