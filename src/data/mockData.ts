import { ChatMessage, ChatRoom } from '../types';

/**
 * Clean production initial state with zero mock data.
 * All chat rooms and messages are loaded dynamically from Google Drive.
 */
export const INITIAL_DEMO_CHATS: ChatRoom[] = [];

export const INITIAL_DEMO_MESSAGES: Record<string, ChatMessage[]> = {};
