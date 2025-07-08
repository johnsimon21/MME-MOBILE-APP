export interface IChatParticipant {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  image?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface ILastMessage {
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: MessageType;
}

export interface IChatResponse {
  id: string;
  participants: IChatParticipant[];
  type: ChatType;
  sessionId?: string;
  createdAt: Date;
  lastMessage?: ILastMessage;
  lastActivity: Date;
  unreadCount: number;
  title?: string;
}

export interface IMessageSender {
  uid: string;
  fullName: string;
  image?: string;
}

export interface IMessageReadBy {
  userId: string;
  userName: string;
  readAt: Date;
}

export interface IReplyToInfo {
  messageId: string;
  content: string;
  senderName: string;
}

export interface IMessageResponse {
  id: string;
  chatId: string;
  sender: IMessageSender;
  content: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  readBy: IMessageReadBy[];
  edited?: boolean;
  editedAt?: Date;
  replyTo?: IReplyToInfo;
}

export interface IChatsListResponse {
  chats: IChatResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IMessagesListResponse {
  messages: IMessageResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ICreateChatRequest {
  participantId: string;
  type: ChatType;
  sessionId?: string;
  title?: string;
}

export interface ISendMessageRequest {
  content: string;
  type: MessageType;
  replyTo?: string;
}

export interface ISendFileMessageRequest {
  caption?: string;
  type: MessageType;
  replyTo?: string;
  file: {
    uri: string;
    type: string;
    name: string;
    size: number;
  };
}

export interface IAddMenteeRequest {
  menteeId: string;
}

export interface IChatQueryParams {
  page?: number;
  limit?: number;
  type?: ChatType;
  search?: string;
}

export interface IMessagesQueryParams {
  page?: number;
  limit?: number;
  before?: string;
  search?: string;
}

export enum ChatType {
  GENERAL = 'general',
  SESSION = 'session'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  CALL = 'call'
}

// Call interfaces
export interface ICallOffer {
  callId: string;
  chatId: string;
  targetUserId: string;
  callerName: string;
  offer: any;
}

export interface ICallAnswer {
  callId: string;
  callerId: string;
  answerName: string;
  answer: any;
}

export interface ICallSignal {
  callId: string;
  targetUserId: string;
  signal: any;
}

export interface IIceCandidate {
  callId: string;
  targetUserId: string;
  candidate: any;
}

// Socket event types
export interface IChatSocketEvents {
  'connected': (data: { userId: string; message: string; timestamp: Date }) => void;
  'joined-chat': (data: { chatId: string; message: string }) => void;
  'left-chat': (data: { chatId: string; message: string }) => void;
  'new-message': (data: { chatId: string; message: IMessageResponse }) => void;
  'message-sent': (data: { chatId: string; messageId: string; timestamp: Date }) => void;
  'file-message-received': (data: { chatId: string; messageId: string; fileType: string; fileName: string; uploadedBy: string; timestamp: Date }) => void;
  'participant-joined': (data: { chatId: string; menteeId: string; addedBy: string; timestamp: Date }) => void;
  'participant-left': (data: { chatId: string; menteeId: string; removedBy: string; timestamp: Date }) => void;
  'added-to-session': (data: { chatId: string; addedBy: string; timestamp: Date }) => void;
  'removed-from-session': (data: { chatId: string; removedBy: string; timestamp: Date }) => void;
  'user-typing': (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  'messages-read': (data: { chatId: string; userId: string; timestamp: Date }) => void;
  'user:online': (data: { userId: string; timestamp: Date }) => void;
  'user:offline': (data: { userId: string; timestamp: Date }) => void;
  'session-changed': (data: { chatId: string; changeType: string; data: any; timestamp: Date }) => void;
  'incoming-call': (data: { callId: string; chatId: string; callerId: string; callerName: string; offer: any; timestamp: Date }) => void;
  'call-answered': (data: { callId: string; answerId: string; answerName: string; answer: any; timestamp: Date }) => void;
  'call-rejected': (data: { callId: string; rejectedBy: string; reason: string; timestamp: Date }) => void;
  'call-ended': (data: { callId: string; endedBy: string; timestamp: Date }) => void;
  'ice-candidate': (data: { callId: string; fromUserId: string; candidate: any }) => void;
  'error': (data: { message: string }) => void;
}
