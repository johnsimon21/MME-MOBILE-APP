export interface IChatParticipant {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  image?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface ILastMessage {
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: MessageType;
}

export interface IChatResponse {
  id: string;
  participants: IChatParticipant[];
  type: ChatType;
  sessionId?: string;
  createdAt: string;
  lastMessage?: ILastMessage;
  lastActivity: string;
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
  readAt: string;
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
  timestamp: string;
  readBy: IMessageReadBy[];
  edited?: boolean;
  editedAt?: string;
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

// Call interfaces - matching backend DTOs
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

// Backend response interfaces
export interface IIncomingCall {
  callId: string;
  chatId: string;
  callerId: string;
  callerName: string;
  offer: any;
  timestamp: Date;
}

export interface ICallAnswered {
  callId: string;
  answerId: string;
  answerName: string;
  answer: any;
  timestamp: Date;
}

export interface ICallRejected {
  callId: string;
  rejectedBy: string;
  reason: string;
  timestamp: Date;
}

export interface ICallEnded {
  callId: string;
  endedBy: string;
  timestamp: Date;
}

export interface ICallOfferSent {
  callId: string;
  targetUserId: string;
  timestamp: Date;
}

export interface ICallFailed {
  callId: string;
  reason: string;
  timestamp: Date;
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
  'incoming-call': (data: IIncomingCall) => void;
  'call-answered': (data: ICallAnswered) => void;
  'call-rejected': (data: ICallRejected) => void;
  'call-ended': (data: ICallEnded) => void;
  'call-offer-sent': (data: ICallOfferSent) => void;
  'call-failed': (data: ICallFailed) => void;
  'ice-candidate': (data: { callId: string; fromUserId: string; candidate: any }) => void;
  'error': (data: { message: string }) => void;
}
