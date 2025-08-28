import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ConversationContext,
  ChatMessage,
  GeoLocation,
  UserPreferences,
} from '../interfaces/chat.interfaces';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, ConversationContext>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Create a new conversation session
   */
  createSession(userId?: string, userLocation?: GeoLocation): string {
    const sessionId = uuidv4();
    const now = new Date();

    const context: ConversationContext = {
      sessionId,
      userId,
      conversationHistory: [],
      locationContext: userLocation,
      preferences: this.getDefaultPreferences(),
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(sessionId, context);
    this.logger.log(
      `Created new session: ${sessionId} for user: ${userId || 'anonymous'}`,
    );

    return sessionId;
  }

  /**
   * Get or create a conversation context
   */
  getOrCreateSession(
    sessionId?: string,
    userId?: string,
    userLocation?: GeoLocation,
  ): ConversationContext {
    if (sessionId && this.sessions.has(sessionId)) {
      const context = this.sessions.get(sessionId)!;

      // Check if session has expired
      if (Date.now() - context.updatedAt.getTime() > this.SESSION_TIMEOUT) {
        this.logger.log(`Session ${sessionId} expired, creating new one`);
        this.sessions.delete(sessionId);
        const newSessionId = this.createSession(userId, userLocation);
        return this.sessions.get(newSessionId)!;
      }

      // Update location if provided
      if (userLocation) {
        context.locationContext = userLocation;
      }

      context.updatedAt = new Date();
      return context;
    }

    // Create new session if none exists or invalid sessionId
    const newSessionId = this.createSession(userId, userLocation);
    return this.sessions.get(newSessionId)!;
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const context = this.sessions.get(sessionId);
    if (!context) {
      this.logger.warn(
        `Attempted to add message to non-existent session: ${sessionId}`,
      );
      return;
    }

    context.conversationHistory.push(message);
    context.updatedAt = new Date();

    // Keep only last 50 messages to prevent memory bloat
    if (context.conversationHistory.length > 50) {
      context.conversationHistory = context.conversationHistory.slice(-50);
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): ChatMessage[] {
    const context = this.sessions.get(sessionId);
    return context?.conversationHistory || [];
  }

  /**
   * Update user preferences for a session
   */
  updatePreferences(
    sessionId: string,
    preferences: Partial<UserPreferences>,
  ): void {
    const context = this.sessions.get(sessionId);
    if (!context) {
      this.logger.warn(
        `Attempted to update preferences for non-existent session: ${sessionId}`,
      );
      return;
    }

    context.preferences = { ...context.preferences, ...preferences };
    context.updatedAt = new Date();
  }

  /**
   * Update last map data for a session
   */
  updateMapData(sessionId: string, mapData: any): void {
    const context = this.sessions.get(sessionId);
    if (!context) {
      this.logger.warn(
        `Attempted to update map data for non-existent session: ${sessionId}`,
      );
      return;
    }

    context.lastMapData = mapData;
    context.updatedAt = new Date();
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, context] of this.sessions.entries()) {
      if (now - context.updatedAt.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { total: number; active: number } {
    const now = Date.now();
    let activeCount = 0;

    for (const context of this.sessions.values()) {
      if (now - context.updatedAt.getTime() <= this.SESSION_TIMEOUT) {
        activeCount++;
      }
    }

    return {
      total: this.sessions.size,
      active: activeCount,
    };
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      units: 'metric',
      radius: 5000, // 5km
      categories: [],
    };
  }

  /**
   * Delete a specific session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.log(`Deleted session: ${sessionId}`);
    }
    return deleted;
  }
}
