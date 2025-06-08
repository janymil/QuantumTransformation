/**
 * Service to fetch user data from the Quantum Challenges app via API
 */

export interface QuantumUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface JournalEntry {
  id: number;
  content: string;
  challengeType: string;
  day?: number;
  createdAt: string;
}

export interface Affirmation {
  id: number;
  content: string;
  category: string;
  isActive: boolean;
}

export interface UserGoal {
  id: number;
  description: string;
  category: string;
  targetDate?: string;
}

export interface UserProgress {
  id: number;
  challengeType: string;
  completedDays: number;
  totalDays: number;
  currentDay: number;
}

export interface UserProfile {
  preferences?: any;
  goals?: string;
  healingReadiness?: number;
  communicationStyle?: string;
  primaryGoals?: string[];
}

export class QuantumAppAPI {
  private baseURL: string;

  constructor() {
    // Use localhost:5000 for local development (quantum app port)
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-quantum-app-domain.com' 
      : 'http://localhost:5000';
  }

  /**
   * Get user data from quantum app
   */
  async getUser(userId: string): Promise<QuantumUserData | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/user/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user from quantum app:', error);
      return null;
    }
  }

  /**
   * Get user's journal entries
   */
  async getUserJournalEntries(userId: string, limit = 10): Promise<JournalEntry[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/journal?userId=${userId}&limit=${limit}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
  }

  /**
   * Get user's affirmations
   */
  async getUserAffirmations(userId: string): Promise<Affirmation[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/saved-phrases?userId=${userId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching affirmations:', error);
      return [];
    }
  }

  /**
   * Get user's progress across challenges
   */
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/progress/all?userId=${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.allProgress || [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  /**
   * Get user profile preferences
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/user-profiles/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get comprehensive user data for AI analysis
   */
  async getComprehensiveUserData(userId: string) {
    const [user, journalEntries, affirmations, progress, profile] = await Promise.all([
      this.getUser(userId),
      this.getUserJournalEntries(userId, 15),
      this.getUserAffirmations(userId),
      this.getUserProgress(userId),
      this.getUserProfile(userId)
    ]);

    return {
      id: userId,
      user,
      journalEntries,
      affirmations,
      progress,
      profile,
      // Convert to format expected by AI engine
      goals: journalEntries
        .filter(entry => entry.content.toLowerCase().includes('goal') || 
                        entry.content.toLowerCase().includes('want') ||
                        entry.content.toLowerCase().includes('achieve'))
        .map(entry => ({
          description: entry.content.substring(0, 200),
          category: entry.challengeType
        })),
      preferences: profile
    };
  }

  /**
   * Validate user authentication with quantum app
   */
  async validateUserAuth(sessionCookie: string): Promise<QuantumUserData | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/user`, {
        headers: {
          'Cookie': sessionCookie
        }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error validating user auth:', error);
      return null;
    }
  }
}