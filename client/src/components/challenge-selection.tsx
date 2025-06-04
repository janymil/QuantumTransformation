import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAllChallengeTypes, type ChallengeType } from "@shared/challenge-types";
import { 
  Clock, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Target,
  Users,
  Lightbulb
} from "lucide-react";

interface ChallengeSelectionProps {
  onSelectChallenge: (challengeId: string) => void;
  selectedChallenge?: string;
}

export default function ChallengeSelection({ 
  onSelectChallenge, 
  selectedChallenge 
}: ChallengeSelectionProps) {
  const [selectedForPreview, setSelectedForPreview] = useState<ChallengeType | null>(null);
  const challenges = getAllChallengeTypes();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradientClass = (gradient: string) => {
    return `bg-gradient-to-br ${gradient}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Choose Your Quantum Journey
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select a 30-day quantum consciousness challenge designed to transform your reality through elevated awareness and intentional practice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Card 
            key={challenge.id}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${
              selectedChallenge === challenge.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => onSelectChallenge(challenge.id)}
          >
            {/* Gradient Header */}
            <div className={`h-20 ${getGradientClass(challenge.gradient)} relative`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute bottom-2 left-4 text-white">
                <div className="text-2xl">{challenge.icon}</div>
              </div>
              <div className="absolute top-2 right-2">
                {selectedChallenge === challenge.id && (
                  <CheckCircle className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            <CardHeader className="pb-4">
              <div className="space-y-2">
                <CardTitle className="text-xl leading-tight">
                  {challenge.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{challenge.subtitle}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {challenge.duration}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {challenge.description}
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Benefits:</h4>
                  <div className="space-y-1">
                    {challenge.benefits.slice(0, 2).map((benefit, index) => (
                      <div key={index} className="flex items-start text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {challenge.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {challenge.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{challenge.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForPreview(challenge);
                      }}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-2xl">{challenge.icon}</span>
                        <span>{challenge.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-700">{challenge.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                          <ul className="space-y-1">
                            {challenge.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Focus Areas:</h4>
                          <div className="flex flex-wrap gap-1">
                            {challenge.focusAreas.map((area) => (
                              <Badge key={area} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {challenge.duration}
                          </div>
                          <Badge className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <Button 
                          onClick={() => onSelectChallenge(challenge.id)}
                          className="flex items-center space-x-2"
                        >
                          <span>Start Challenge</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  className="flex-1 flex items-center justify-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChallenge(challenge.id);
                  }}
                >
                  <span>Start</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedChallenge && (
        <div className="text-center">
          <Button size="lg" className="px-8">
            Continue to Challenge
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}