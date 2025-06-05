import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { getChallengeUrl } from "@shared/challenge-types";

interface ChallengeHeaderProps {
  challengeType: string;
  currentDay: number;
  challengeTitle: string;
  isCompleted: boolean;
}

export default function ChallengeHeader({
  challengeType,
  currentDay,
  challengeTitle,
  isCompleted
}: ChallengeHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/${getChallengeUrl(challengeType)}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Day {currentDay}
                </h1>
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {challengeTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}