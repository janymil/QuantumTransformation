/**
 * Database Connection Manager
 * Handles connection pooling and error recovery for document processing
 */

import { db } from './db';

class DatabaseConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a connection termination error
      if (this.isConnectionError(error) && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Database connection error, attempting reconnect ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        this.reconnectAttempts++;
        
        // Wait before retrying
        await this.delay(this.reconnectDelay);
        this.reconnectDelay *= 2; // Exponential backoff
        
        return this.executeWithRetry(operation);
      }
      
      // Reset on success or max attempts reached
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      throw error;
    }
  }

  private isConnectionError(error: any): boolean {
    const connectionErrorCodes = [
      '57P01', // terminating connection due to administrator command
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return connectionErrorCodes.some(code => 
      error.code === code || 
      error.message?.includes(code) ||
      error.message?.includes('connection') ||
      error.message?.includes('terminating')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const dbConnectionManager = new DatabaseConnectionManager();