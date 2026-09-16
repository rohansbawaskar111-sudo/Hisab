export type Role = 'user' | 'admin' | 'moderator';

export type Gender = 'woman' | 'man' | 'non-binary' | 'other';
export type InterestedIn = 'women' | 'men' | 'everyone';

export type RelationshipIntention =
  | 'Long-term partner'
  | 'Long-term, open to short'
  | 'Short-term fun'
  | 'New friends'
  | 'Still figuring it out';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: Role;
  isVerified: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil?: string | null;
  isDemo?: boolean;
  isAdult?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PhotoStyle =
  | 'Stylish fashion'
  | 'Party look'
  | 'Beach/resort'
  | 'Evening outfit'
  | 'Casual attractive'
  | 'Glamour'
  | 'Studio portrait'
  | 'Travel'
  | 'Dating profile';

export type AiPhotoPreset =
  | 'glamour'
  | 'fashion'
  | 'beach'
  | 'night_out'
  | 'romantic_date'
  | 'studio'
  | 'travel'
  | 'premium_dating';

export interface Photo {
  id: string;
  profileId: string;
  userId?: string;
  url: string;
  isMain: boolean;
  isPrimary?: boolean;
  order: number;
  createdAt: string;
  isAiGenerated?: boolean;
  style?: PhotoStyle | string;
  visibility?: 'public' | 'matches_only' | 'private';
}

export interface Interest {
  id: string;
  name: string;
  category: 'lifestyle' | 'creativity' | 'sports' | 'music' | 'food' | 'entertainment';
  icon?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  gender: Gender;
  interestedIn: InterestedIn;
  city: string;
  locationLat?: number;
  locationLng?: number;
  distanceKm?: number; // Calculated relative to requesting user
  bio: string;
  occupation?: string;
  education?: string;
  height?: string;
  languages: string[];
  relationshipIntention: RelationshipIntention;
  isIncognito: boolean;
  hideAge: boolean;
  hideDistance: boolean;
  isOnline: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  interests: Interest[];
  isVerified?: boolean;
  isDemo?: boolean;
  isAdult?: boolean;
  datingIntent?: string;
  relationshipPreference?: string;
  visibility?: 'public' | '18plus_only' | 'hidden';
  compatibilityScore?: number;
  // Profile & Privacy Controls
  profileVisibility?: 'public' | 'incognito' | 'matches_only';
  photoVisibility?: 'all' | 'matches_only';
  whoCanMessage?: 'all' | 'matches' | 'verified_matches';
  whoCanLike?: 'everyone' | 'verified_only';
  whoCanCall?: 'mutual_matches' | 'favorites_only';
}

export interface Preference {
  id: string;
  userId: string;
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  genderPreference: InterestedIn;
  relationshipIntention?: RelationshipIntention | 'any';
  verifiedOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  senderId: string;
  targetId: string;
  createdAt: string;
}

export interface Pass {
  id: string;
  senderId: string;
  targetId: string;
  createdAt: string;
}

export interface SuperLike {
  id: string;
  senderId: string;
  targetId: string;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedUser: UserProfile;
  createdAt: string;
  updatedAt: string;
  isUnmatched: boolean;
  compatibilityScore: number;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Conversation {
  id: string;
  matchId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  isDeleted?: boolean;
}

export type NotificationType =
  | 'match'
  | 'like'
  | 'superlike'
  | 'message'
  | 'verification'
  | 'safety';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export type ReportReason =
  | 'Fake profile'
  | 'Harassment'
  | 'Spam'
  | 'Inappropriate content'
  | 'Scam'
  | 'Threatening behavior'
  | 'Other';

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  targetType: 'profile' | 'message' | 'conversation';
  targetId: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string | null;
  actionTaken?: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  selfieUrl: string;
  poseType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface AdminAction {
  id: string;
  adminId: string;
  targetUserId: string;
  actionType: 'warn' | 'suspend' | 'ban' | 'restore';
  reason: string;
  createdAt: string;
}

export interface DiscoveryFilters {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  gender: InterestedIn;
  relationshipIntention?: string;
  verifiedOnly: boolean;
  interests?: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  matches: number;
  messages: number;
  pendingReports: number;
  verificationRequests: number;
  blockedAccounts: number;
  bannedUsers: number;
}

export type CallStatus =
  | 'INITIATING'
  | 'RINGING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'MISSED'
  | 'CONNECTING'
  | 'ACTIVE'
  | 'ENDED'
  | 'FAILED';

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  conversationId: string;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
  endedReason?: string;
  createdAt: string;
}

export interface AICompanion {
  id: string;
  name: string;
  age: number;
  personality: string;
  interests: string[];
  avatar: string;
  greeting: string;
  suggestedQuestions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  aiCompanionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export type ActiveTab =
  | 'discover'
  | 'adult_dating'
  | 'ai_companions'
  | 'likes'
  | 'matches'
  | 'chat'
  | 'profile'
  | 'admin'
  | 'explore';

