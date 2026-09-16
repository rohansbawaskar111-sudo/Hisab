import {
  User,
  UserProfile,
  Photo,
  Match,
  Message,
  Notification,
  Report,
  VerificationRequest,
  AdminStats,
  DiscoveryFilters,
  Interest,
  Call,
  AICompanion,
  AIConversation,
  AIMessage,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('vibematch_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('vibematch_token', token);
    } else {
      localStorage.removeItem('vibematch_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Auth endpoints
  async register(payload: any): Promise<{ token: string; user: User; profile: UserProfile }> {
    const res = await this.request<{ token: string; user: User; profile: UserProfile }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    this.setToken(res.token);
    return res;
  }

  async login(payload: { email: string; password: string }): Promise<{ token: string; user: User; profile: UserProfile }> {
    const res = await this.request<{ token: string; user: User; profile: UserProfile }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    this.setToken(res.token);
    return res;
  }

  async demoLogin(role: 'user' | 'admin' = 'user'): Promise<{ token: string; user: User; profile: UserProfile }> {
    const res = await this.request<{ token: string; user: User; profile: UserProfile }>(
      '/auth/demo-login',
      {
        method: 'POST',
        body: JSON.stringify({ role }),
      }
    );
    this.setToken(res.token);
    return res;
  }

  async getCurrentUser(): Promise<{ user: User; profile: UserProfile }> {
    return this.request<{ user: User; profile: UserProfile }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Discovery & Profiles
  async getDiscoverFeed(filters?: Partial<DiscoveryFilters>): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (filters?.minAge) params.append('minAge', filters.minAge.toString());
    if (filters?.maxAge) params.append('maxAge', filters.maxAge.toString());
    if (filters?.maxDistanceKm) params.append('maxDistanceKm', filters.maxDistanceKm.toString());
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.verifiedOnly) params.append('verifiedOnly', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<UserProfile[]>(`/profiles/discover${query}`);
  }

  // 18+ Adult Dating Feed
  async getAdultDatingFeed(filters?: any): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (filters?.minAge) params.append('minAge', filters.minAge.toString());
    if (filters?.maxAge) params.append('maxAge', filters.maxAge.toString());
    if (filters?.city) params.append('city', filters.city);
    if (filters?.datingIntent) params.append('datingIntent', filters.datingIntent);
    if (filters?.relationshipPreference) params.append('relationshipPreference', filters.relationshipPreference);
    if (filters?.verifiedOnly) params.append('verifiedOnly', 'true');
    if (filters?.isOnline) params.append('isOnline', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<UserProfile[]>(`/profiles/adult-dating${query}`);
  }

  // Database Search Users
  async searchUsers(query: string, isAdultOnly?: boolean): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (isAdultOnly) params.append('isAdultOnly', 'true');
    return this.request<UserProfile[]>(`/profiles/search?${params.toString()}`);
  }

  async getInterests(): Promise<Interest[]> {
    return this.request<Interest[]>('/profiles/interests');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getProfile(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/profiles/${userId}`);
  }

  // Swiping & Interactions
  async like(targetId: string): Promise<{ success: boolean; isMatch: boolean; match?: Match }> {
    return this.request<{ success: boolean; isMatch: boolean; match?: Match }>('/likes', {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }

  async superLike(targetId: string): Promise<{ success: boolean; isMatch: boolean; match?: Match }> {
    return this.request<{ success: boolean; isMatch: boolean; match?: Match }>('/super-likes', {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }

  async pass(targetId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/passes', {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  }

  async getInboundLikes(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/likes/inbound');
  }

  async getSentLikes(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/likes/sent');
  }

  async removeLike(targetId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/likes/${targetId}`, {
      method: 'DELETE',
    });
  }

  async getMatches(): Promise<Match[]> {
    return this.request<Match[]>('/matches');
  }

  async unmatch(matchId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/matches/${matchId}/unmatch`, {
      method: 'POST',
    });
  }

  // Video Calls
  async initiateCall(receiverId: string, conversationId: string): Promise<{ success: boolean; call: Call; isDemoRecipient: boolean }> {
    return this.request<{ success: boolean; call: Call; isDemoRecipient: boolean }>('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ receiverId, conversationId }),
    });
  }

  async acceptCall(callId: string): Promise<{ success: boolean; call: Call }> {
    return this.request<{ success: boolean; call: Call }>(`/calls/${callId}/accept`, {
      method: 'POST',
    });
  }

  async declineCall(callId: string): Promise<{ success: boolean; call: Call }> {
    return this.request<{ success: boolean; call: Call }>(`/calls/${callId}/decline`, {
      method: 'POST',
    });
  }

  async endCall(callId: string, durationSeconds: number): Promise<{ success: boolean; call: Call }> {
    return this.request<{ success: boolean; call: Call }>(`/calls/${callId}/end`, {
      method: 'POST',
      body: JSON.stringify({ durationSeconds }),
    });
  }

  async getCallHistory(conversationId: string): Promise<Call[]> {
    return this.request<Call[]>(`/calls/history/${conversationId}`);
  }

  // AI Companions
  async getAICompanions(): Promise<AICompanion[]> {
    return this.request<AICompanion[]>('/ai/companions');
  }

  async getAICompanion(id: string): Promise<AICompanion> {
    return this.request<AICompanion>(`/ai/companions/${id}`);
  }

  async getAIConversation(companionId: string): Promise<{ conversation: AIConversation; messages: AIMessage[]; companion: AICompanion }> {
    return this.request<{ conversation: AIConversation; messages: AIMessage[]; companion: AICompanion }>(`/ai/conversations/${companionId}`);
  }

  async sendAIMessage(companionId: string, content: string): Promise<{ success: boolean; userMessage: AIMessage; aiMessage: AIMessage }> {
    return this.request<{ success: boolean; userMessage: AIMessage; aiMessage: AIMessage }>(`/ai/conversations/${companionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // AI Photo Creator & Management
  async createAiPhoto(payload: {
    preset: string;
    outfit?: string;
    hairstyle?: string;
    background?: string;
    pose?: string;
    lighting?: string;
    style?: string;
    representsUser?: boolean;
    referencePhotoUrl?: string;
    visibility?: 'public' | 'matches_only';
  }): Promise<{ success: boolean; photo: Photo; message: string }> {
    return this.request<{ success: boolean; photo: Photo; message: string }>('/ai/create-photo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Photo Management
  async addProfilePhoto(payload: {
    url: string;
    isPrimary?: boolean;
    replacePhotoId?: string;
    isAiGenerated?: boolean;
    style?: string;
    visibility?: 'public' | 'matches_only' | 'private';
  }): Promise<{ success: boolean; photo: Photo; profile: UserProfile }> {
    return this.request<{ success: boolean; photo: Photo; profile: UserProfile }>('/profiles/me/photos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async setPrimaryPhoto(photoId: string): Promise<{ success: boolean; profile: UserProfile }> {
    return this.request<{ success: boolean; profile: UserProfile }>(`/profiles/me/photos/${photoId}/primary`, {
      method: 'PUT',
    });
  }

  async replaceProfilePhoto(photoId: string, url: string): Promise<{ success: boolean; photo: Photo; profile: UserProfile }> {
    return this.request<{ success: boolean; photo: Photo; profile: UserProfile }>(`/profiles/me/photos/${photoId}/replace`, {
      method: 'PUT',
      body: JSON.stringify({ url }),
    });
  }

  async deleteProfilePhoto(photoId: string): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
    return this.request<{ success: boolean; profile?: UserProfile; message?: string }>(`/profiles/me/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  // Messaging
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, text: string, imageUrl?: string): Promise<Message> {
    return this.request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, imageUrl }),
    });
  }

  async markConversationRead(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Safety & Moderation
  async reportUser(payload: {
    reportedUserId: string;
    targetType?: string;
    targetId?: string;
    reason: string;
    details: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/safety/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async blockUser(blockedUserId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/safety/blocks', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    });
  }

  async requestVerification(selfieUrl: string, poseType: string): Promise<any> {
    return this.request('/safety/verification/request', {
      method: 'POST',
      body: JSON.stringify({ selfieUrl, poseType }),
    });
  }

  async getVerificationStatus(): Promise<{ isVerified: boolean; request: any }> {
    return this.request('/safety/verification/status');
  }

  async exportAccountData(): Promise<any> {
    return this.request('/safety/account/export', {
      method: 'POST',
    });
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    return this.request('/safety/account', {
      method: 'DELETE',
    });
  }

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/admin/stats');
  }

  async getAdminUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }

  async takeAdminUserAction(userId: string, action: string, reason: string): Promise<any> {
    return this.request(`/admin/users/${userId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  async getAdminReports(): Promise<Report[]> {
    return this.request<Report[]>('/admin/reports');
  }

  async resolveAdminReport(reportId: string, actionTaken: string): Promise<any> {
    return this.request(`/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ actionTaken }),
    });
  }

  async getAdminVerifications(): Promise<VerificationRequest[]> {
    return this.request<VerificationRequest[]>('/admin/verifications');
  }

  async resolveAdminVerification(verificationId: string, status: 'approved' | 'rejected', notes?: string): Promise<any> {
    return this.request(`/admin/verifications/${verificationId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  }

  async resetData(): Promise<any> {
    return this.request('/admin/reset-data', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
