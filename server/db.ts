import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserProfile,
  Photo,
  Interest,
  Preference,
  Like,
  Pass,
  SuperLike,
  Match,
  Conversation,
  Message,
  Notification,
  Report,
  Block,
  VerificationRequest,
  AdminAction,
  DiscoveryFilters,
  AdminStats,
  Call,
  CallStatus,
  AICompanion,
  AIConversation,
  AIMessage,
} from '../src/types';
import { INITIAL_INTERESTS, SEED_PROFILES, SEED_AI_COMPANIONS } from './seedData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'vibematch_db.json');

export interface UserInterestRecord {
  id: string;
  userId: string;
  interestId: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: UserProfile[];
  photos: Photo[];
  interests: Interest[];
  user_interests: UserInterestRecord[];
  preferences: Preference[];
  likes: Like[];
  passes: Pass[];
  super_likes: SuperLike[];
  matches: Match[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  reports: Report[];
  blocks: Block[];
  verification_requests: VerificationRequest[];
  admin_actions: AdminAction[];
  sessions: SessionRecord[];
  calls: Call[];
  ai_companions: AICompanion[];
  ai_conversations: AIConversation[];
  ai_messages: AIMessage[];
}

class VibeMatchDatabase {
  private data: DatabaseSchema = {
    users: [],
    profiles: [],
    photos: [],
    interests: [],
    user_interests: [],
    preferences: [],
    likes: [],
    passes: [],
    super_likes: [],
    matches: [],
    conversations: [],
    messages: [],
    notifications: [],
    reports: [],
    blocks: [],
    verification_requests: [],
    admin_actions: [],
    sessions: [],
    calls: [],
    ai_companions: [],
    ai_conversations: [],
    ai_messages: [],
  };

  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[Database] Loaded existing database from disk');

        // Ensure new arrays exist
        this.data.calls = this.data.calls || [];
        this.data.ai_companions = this.data.ai_companions || [];
        this.data.ai_conversations = this.data.ai_conversations || [];
        this.data.ai_messages = this.data.ai_messages || [];

        // Seed AI companions if missing
        if (this.data.ai_companions.length === 0) {
          const now = new Date().toISOString();
          this.data.ai_companions = SEED_AI_COMPANIONS.map((c) => ({
            ...c,
            isActive: true,
            createdAt: now,
          }));
        }

        // Ensure that new 30 profiles and exact seed structure are refreshed
        if (
          this.data.profiles.length < 30 ||
          !this.data.profiles.some((p) => p.firstName === 'Aanya') ||
          !this.data.profiles.some((p) => p.firstName === 'Tara')
        ) {
          console.log('[Database] Upgrading database with new 30 demo profiles including 18+ adult profiles');
          this.seedInitialData(true);
        } else {
          // Normalize adult fields & clean up any auto-injected demo photos from real users
          const defaultDemoUrls = [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          ];

          this.data.users.forEach((u) => {
            if (u.isAdult === undefined) {
              const prof = this.data.profiles.find((p) => p.userId === u.id);
              u.isAdult = prof ? prof.age >= 18 : true;
            }

            // Real user check
            const isRealUser = u.isDemo !== true && !u.id.startsWith('user-seed-') && u.role !== 'admin';
            if (isRealUser) {
              const prof = this.data.profiles.find((p) => p.userId === u.id);
              if (prof) {
                const userPhotos = this.data.photos.filter((p) => p.profileId === prof.id || p.userId === u.id);
                const hasUploadedPhoto = userPhotos.some((p) => !defaultDemoUrls.includes(p.url));

                if (hasUploadedPhoto) {
                  // Purge default demo photos so user's uploaded photo is Photo #1
                  this.data.photos = this.data.photos.filter(
                    (p) => !((p.profileId === prof.id || p.userId === u.id) && defaultDemoUrls.includes(p.url))
                  );
                } else if (userPhotos.some((p) => defaultDemoUrls.includes(p.url))) {
                  // Real user had ONLY the auto-assigned default photo -> clear it completely
                  this.data.photos = this.data.photos.filter(
                    (p) => !(p.profileId === prof.id || p.userId === u.id)
                  );
                }

                // Re-sync remaining photos
                const remaining = this.data.photos.filter((p) => p.profileId === prof.id || p.userId === u.id);
                remaining.forEach((p, idx) => {
                  p.isMain = idx === 0;
                  p.isPrimary = idx === 0;
                  p.order = idx;
                });
                prof.photos = remaining;
              }
            }
          });
          this.data.profiles.forEach((p) => {
            if (p.isAdult === undefined) p.isAdult = p.age >= 18;
            if (!p.datingIntent) p.datingIntent = p.relationshipIntention || 'Casual dating';
            if (!p.relationshipPreference) p.relationshipPreference = p.relationshipIntention || 'Open to dating';
            if (!p.visibility) p.visibility = 'public';
          });
          this.save();
        }
      } else {
        console.log('[Database] Initializing fresh database with seed data');
        this.seedInitialData();
        this.save();
      }
      this.isInitialized = true;
    } catch (err) {
      console.error('[Database] Failed to load database, resetting to seed:', err);
      this.seedInitialData();
      this.save();
      this.isInitialized = true;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Error persisting database to disk:', err);
    }
  }

  public seedInitialData(force = false) {
    if (!force && this.data.users.length > 0) return;

    const now = new Date().toISOString();
    const defaultPasswordHash = bcrypt.hashSync('Vibe123!', 10);
    const adminPasswordHash = bcrypt.hashSync('AdminPass123!', 10);

    this.data = {
      users: [],
      profiles: [],
      photos: [],
      interests: [...INITIAL_INTERESTS],
      user_interests: [],
      preferences: [],
      likes: [],
      passes: [],
      super_likes: [],
      matches: [],
      conversations: [],
      messages: [],
      notifications: [],
      reports: [],
      blocks: [],
      verification_requests: [],
      admin_actions: [],
      sessions: [],
      calls: [],
      ai_companions: SEED_AI_COMPANIONS.map((c) => ({
        ...c,
        isActive: true,
        createdAt: now,
      })),
      ai_conversations: [],
      ai_messages: [],
    };

    // 1. Create Admin User
    const adminUser: User = {
      id: 'user-admin',
      email: 'admin@vibematch.app',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isVerified: true,
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(adminUser);

    const adminProfile: UserProfile = {
      id: 'profile-admin',
      userId: adminUser.id,
      firstName: 'Sarah (Admin)',
      birthDate: '1994-06-15',
      age: 32,
      gender: 'woman',
      interestedIn: 'everyone',
      city: 'New York, NY',
      locationLat: 40.7128,
      locationLng: -74.006,
      bio: 'VibeMatch platform community manager & trust lead.',
      occupation: 'Lead Safety & Trust Admin',
      education: 'NYU',
      height: '5\'8"',
      languages: ['English', 'Spanish'],
      relationshipIntention: 'New friends',
      isIncognito: false,
      hideAge: false,
      hideDistance: false,
      isOnline: true,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
      photos: [
        {
          id: 'photo-admin-1',
          profileId: 'profile-admin',
          url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
          isMain: true,
          order: 0,
          createdAt: now,
        },
      ],
      interests: [INITIAL_INTERESTS[0], INITIAL_INTERESTS[1]],
      isVerified: true,
    };
    this.data.profiles.push(adminProfile);

    // 2. Create Demo User (Alex Rivers)
    const demoUser: User = {
      id: 'user-demo',
      email: 'alex@vibematch.app',
      passwordHash: defaultPasswordHash,
      role: 'user',
      isVerified: true,
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(demoUser);

    const demoProfile: UserProfile = {
      id: 'profile-demo',
      userId: demoUser.id,
      firstName: 'Alex',
      birthDate: '1999-04-18',
      age: 27,
      gender: 'man',
      interestedIn: 'everyone',
      city: 'Pune',
      locationLat: 18.5204,
      locationLng: 73.8567,
      bio: 'Photographer & indie film buff based in Pune. Always hunting down the best pour-over coffee or weekend hiking trails in Sahyadris. Let us swap favorite Spotify playlists!',
      occupation: 'Documentary Visual Designer',
      education: 'COEP Pune',
      height: '6\'0"',
      languages: ['English', 'Hindi', 'Marathi'],
      relationshipIntention: 'Long-term partner',
      isIncognito: false,
      hideAge: false,
      hideDistance: false,
      isOnline: true,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
      photos: [
        {
          id: 'photo-demo-1',
          profileId: 'profile-demo',
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          isMain: true,
          order: 0,
          createdAt: now,
        },
        {
          id: 'photo-demo-2',
          profileId: 'profile-demo',
          url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
          isMain: false,
          order: 1,
          createdAt: now,
        },
      ],
      interests: [INITIAL_INTERESTS[0], INITIAL_INTERESTS[1], INITIAL_INTERESTS[2], INITIAL_INTERESTS[3]],
      isVerified: true,
      isDemo: true,
    };
    this.data.profiles.push(demoProfile);

    this.data.preferences.push({
      id: 'pref-demo',
      userId: demoUser.id,
      minAge: 18,
      maxAge: 40,
      maxDistanceKm: 1500,
      genderPreference: 'everyone',
      relationshipIntention: 'any',
      verifiedOnly: false,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Seed 30 Profiles
    const seededUserIds: string[] = [];

    SEED_PROFILES.forEach((seed, index) => {
      const uId = `user-seed-${index + 1}`;
      const pId = `profile-seed-${index + 1}`;
      seededUserIds.push(uId);

      const u: User = {
        id: uId,
        email: seed.email,
        passwordHash: defaultPasswordHash,
        role: 'user',
        isVerified: seed.isVerified,
        isBanned: false,
        isSuspended: false,
        isDemo: true,
        isAdult: true,
        createdAt: now,
        updatedAt: now,
      };
      this.data.users.push(u);

      const photoStyles = [
        'Stylish fashion',
        'Beach/resort',
        'Glamour',
        'Evening outfit',
        'Studio portrait',
        'Travel',
        'Dating profile',
        'Party look',
      ];
      const photos: Photo[] = seed.photos.map((url, pIdx) => ({
        id: `photo-seed-${index + 1}-${pIdx + 1}`,
        profileId: pId,
        userId: uId,
        url,
        isMain: pIdx === 0,
        order: pIdx,
        isAiGenerated: pIdx === 1, // sample profile includes an AI generated showcase photo
        style: photoStyles[(index + pIdx) % photoStyles.length],
        visibility: 'public',
        createdAt: now,
      }));
      this.data.photos.push(...photos);

      const profileInterests: Interest[] = [];
      seed.interests.forEach((intName) => {
        const matched = this.data.interests.find((i) => i.name === intName);
        if (matched) {
          profileInterests.push(matched);
          this.data.user_interests.push({
            id: `ui-${uId}-${matched.id}`,
            userId: uId,
            interestId: matched.id,
          });
        }
      });

      const prof: UserProfile = {
        id: pId,
        userId: uId,
        firstName: seed.firstName,
        birthDate: seed.birthDate,
        age: seed.age,
        gender: seed.gender,
        interestedIn: seed.interestedIn,
        city: seed.city,
        locationLat: seed.locationLat,
        locationLng: seed.locationLng,
        bio: seed.bio,
        occupation: seed.occupation,
        education: seed.education,
        height: seed.height,
        languages: seed.languages,
        relationshipIntention: seed.relationshipIntention,
        isIncognito: false,
        hideAge: false,
        hideDistance: false,
        isOnline: index % 2 === 0,
        lastActiveAt: new Date(Date.now() - index * 3600000).toISOString(),
        createdAt: now,
        updatedAt: now,
        photos,
        interests: profileInterests,
        isVerified: seed.isVerified,
        isDemo: true,
        isAdult: seed.isAdult ?? (seed.age >= 18),
        datingIntent: seed.datingIntent || seed.relationshipIntention || 'Casual dating',
        relationshipPreference: seed.relationshipPreference || seed.relationshipIntention || 'Open to dating',
        visibility: 'public',
      };
      this.data.profiles.push(prof);

      this.data.preferences.push({
        id: `pref-${uId}`,
        userId: uId,
        minAge: 20,
        maxAge: 38,
        maxDistanceKm: 250,
        genderPreference: seed.interestedIn,
        relationshipIntention: seed.relationshipIntention,
        verifiedOnly: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    // 4. Create Pre-seeded Matches & Conversations for the Demo User
    // Match 1: Aanya (seed-1, Pune) + Alex (demo)
    const aanyaUserId = 'user-seed-1';
    const match1Id = 'match-demo-aanya';
    const conv1Id = 'conv-demo-aanya';

    this.data.likes.push(
      { id: 'like-aanya-alex', senderId: aanyaUserId, targetId: demoUser.id, createdAt: now },
      { id: 'like-alex-aanya', senderId: demoUser.id, targetId: aanyaUserId, createdAt: now }
    );

    const aanyaProfile = this.data.profiles.find((p) => p.userId === aanyaUserId)!;

    this.data.matches.push({
      id: match1Id,
      user1Id: demoUser.id,
      user2Id: aanyaUserId,
      matchedUser: aanyaProfile,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: now,
      isUnmatched: false,
      compatibilityScore: 94,
    });

    this.data.conversations.push({
      id: conv1Id,
      matchId: match1Id,
      participantIds: [demoUser.id, aanyaUserId],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: now,
    });

    this.data.messages.push(
      {
        id: 'msg-1',
        conversationId: conv1Id,
        senderId: aanyaUserId,
        text: 'Hey! Nice to match with you! 😊',
        isRead: true,
        readAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 7100000).toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: conv1Id,
        senderId: demoUser.id,
        text: 'Hey Aanya! Loved your photos in Pune. Have you checked out that new cafe in Koregaon Park?',
        isRead: true,
        readAt: new Date(Date.now() - 3000000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg-3',
        conversationId: conv1Id,
        senderId: aanyaUserId,
        text: 'Yes! The pour-over there is amazing! We should go together sometime ☕✨',
        isRead: false,
        readAt: null,
        createdAt: new Date(Date.now() - 1200000).toISOString(),
      }
    );

    // Match 2: Riya (seed-3, Mumbai) + Alex (demo)
    const riyaUserId = 'user-seed-3';
    const match2Id = 'match-demo-riya';
    const conv2Id = 'conv-demo-riya';

    this.data.likes.push(
      { id: 'like-riya-alex', senderId: riyaUserId, targetId: demoUser.id, createdAt: now },
      { id: 'like-alex-riya', senderId: demoUser.id, targetId: riyaUserId, createdAt: now }
    );

    const riyaProfile = this.data.profiles.find((p) => p.userId === riyaUserId)!;

    this.data.matches.push({
      id: match2Id,
      user1Id: demoUser.id,
      user2Id: riyaUserId,
      matchedUser: riyaProfile,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: now,
      isUnmatched: false,
      compatibilityScore: 89,
    });

    this.data.conversations.push({
      id: conv2Id,
      matchId: match2Id,
      participantIds: [demoUser.id, riyaUserId],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: now,
    });

    this.data.messages.push(
      {
        id: 'msg-4',
        conversationId: conv2Id,
        senderId: riyaUserId,
        text: 'Hi! How was your day?',
        isRead: true,
        readAt: new Date(Date.now() - 40000000).toISOString(),
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'msg-5',
        conversationId: conv2Id,
        senderId: demoUser.id,
        text: 'Hey Riya! Busy with design shoots, but good! How is your week in Mumbai going?',
        isRead: true,
        readAt: new Date(Date.now() - 30000000).toISOString(),
        createdAt: new Date(Date.now() - 35000000).toISOString(),
      },
      {
        id: 'msg-6',
        conversationId: conv2Id,
        senderId: riyaUserId,
        text: 'Pretty exciting! Exploring vintage thrift stores in Bandra today 🎨',
        isRead: true,
        readAt: new Date(Date.now() - 20000000).toISOString(),
        createdAt: new Date(Date.now() - 25000000).toISOString(),
      }
    );

    // Seed a couple inbound likes for Alex to see on the "Likes" page!
    // Neha (seed-2, Nashik) liked Alex
    this.data.likes.push({
      id: 'like-neha-alex',
      senderId: 'user-seed-2',
      targetId: demoUser.id,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    });
    // Sneha (seed-4, Chhatrapati Sambhajinagar) liked Alex
    this.data.likes.push({
      id: 'like-sneha-alex',
      senderId: 'user-seed-4',
      targetId: demoUser.id,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    });
    // Priya (seed-5, Pune) super-liked Alex!
    this.data.super_likes.push({
      id: 'slike-priya-alex',
      senderId: 'user-seed-5',
      targetId: demoUser.id,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    });
    // Tanvi (seed-8, Thane) liked Alex
    this.data.likes.push({
      id: 'like-tanvi-alex',
      senderId: 'user-seed-8',
      targetId: demoUser.id,
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    });
    // Simran (seed-15, Chandigarh) liked Alex
    this.data.likes.push({
      id: 'like-simran-alex',
      senderId: 'user-seed-15',
      targetId: demoUser.id,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // Seed notifications for Alex
    this.data.notifications.push(
      {
        id: 'notif-1',
        userId: demoUser.id,
        type: 'match',
        title: 'New Match!',
        message: 'You and Aanya matched! Say hello and start the vibe.',
        referenceId: match1Id,
        isRead: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'notif-2',
        userId: demoUser.id,
        type: 'message',
        title: 'New Message from Aanya',
        message: 'Yes! The pour-over there is amazing! We should go together...',
        referenceId: conv1Id,
        isRead: false,
        createdAt: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        id: 'notif-3',
        userId: demoUser.id,
        type: 'superlike',
        title: 'Someone Super Liked you!',
        message: 'A match in your area sent you a Super Like ✨',
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      }
    );

    // Seed sample reports and verification requests for admin view
    this.data.reports.push({
      id: 'report-sample-1',
      reporterId: 'user-seed-1',
      reporterName: 'Maya',
      reportedUserId: 'user-seed-9',
      reportedUserName: 'Leo',
      targetType: 'profile',
      targetId: 'profile-seed-9',
      reason: 'Spam',
      details: 'Profile bio seemed to advertise an external event ticket link repeatedly.',
      status: 'pending',
      createdAt: new Date(Date.now() - 18000000).toISOString(),
    });

    this.data.verification_requests.push({
      id: 'verif-sample-1',
      userId: 'user-seed-5',
      userName: 'Marcus',
      userEmail: 'marcus@vibematch.app',
      selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      poseType: 'peace_sign',
      status: 'pending',
      createdAt: new Date(Date.now() - 25000000).toISOString(),
    });

    this.save();
    console.log('[Database] Seed data successfully generated.');
  }

  // ================= User Operations =================
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(email: string, passwordHash: string, role: 'user' | 'admin' = 'user'): User {
    const now = new Date().toISOString();
    const newUser: User = {
      id: `user-${uuidv4().substring(0, 8)}`,
      email,
      passwordHash,
      role,
      isVerified: false,
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  public deleteUser(userId: string): boolean {
    const uIdx = this.data.users.findIndex((u) => u.id === userId);
    if (uIdx === -1) return false;

    this.data.users.splice(uIdx, 1);
    this.data.profiles = this.data.profiles.filter((p) => p.userId !== userId);
    this.data.likes = this.data.likes.filter((l) => l.senderId !== userId && l.targetId !== userId);
    this.data.passes = this.data.passes.filter((p) => p.senderId !== userId && p.targetId !== userId);
    this.data.super_likes = this.data.super_likes.filter((s) => s.senderId !== userId && s.targetId !== userId);
    this.data.matches = this.data.matches.filter((m) => m.user1Id !== userId && m.user2Id !== userId);
    this.data.blocks = this.data.blocks.filter((b) => b.blockerId !== userId && b.blockedUserId !== userId);
    this.save();
    return true;
  }

  // ================= Profile Operations =================
  private reorderPhotos(userId: string, profileId: string) {
    const userPhotos = this.data.photos.filter(
      (p) => p.profileId === profileId || p.userId === userId
    );
    if (userPhotos.length === 0) {
      const prof = this.data.profiles.find((p) => p.id === profileId || p.userId === userId);
      if (prof) prof.photos = [];
      return;
    }

    // Find primary: first one explicitly marked as isPrimary or isMain, else first photo
    const primaryIdx = userPhotos.findIndex((p) => p.isPrimary || p.isMain);
    const primary = primaryIdx !== -1 ? userPhotos[primaryIdx] : userPhotos[0];

    primary.isMain = true;
    primary.isPrimary = true;
    primary.order = 0;

    let orderCounter = 1;
    userPhotos.forEach((p) => {
      if (p.id !== primary.id) {
        p.isMain = false;
        p.isPrimary = false;
        p.order = orderCounter++;
      }
    });

    // Sort this.data.photos for this user
    const otherPhotos = this.data.photos.filter(
      (p) => !(p.profileId === profileId || p.userId === userId)
    );
    const sortedUserPhotos = [primary, ...userPhotos.filter((p) => p.id !== primary.id).sort((a, b) => (a.order || 0) - (b.order || 0))];
    this.data.photos = [...otherPhotos, ...sortedUserPhotos];

    const prof = this.data.profiles.find((p) => p.id === profileId || p.userId === userId);
    if (prof) {
      prof.photos = sortedUserPhotos;
    }
  }

  public getProfileByUserId(userId: string): UserProfile | undefined {
    const profile = this.data.profiles.find((p) => p.userId === userId);
    if (!profile) return undefined;

    // Attach fresh photos and interests
    const photos = this.data.photos.filter((ph) => ph.profileId === profile.id || ph.userId === userId);
    const userInts = this.data.user_interests.filter((ui) => ui.userId === userId);
    const interests = userInts
      .map((ui) => this.data.interests.find((i) => i.id === ui.interestId))
      .filter((i): i is Interest => !!i);

    const user = this.getUserById(userId);

    // Strictly ensure primary photo is at index 0
    const sortedPhotos = [...photos].sort((a, b) => {
      const aPrimary = a.isPrimary || a.isMain;
      const bPrimary = b.isPrimary || b.isMain;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    return {
      ...profile,
      photos: sortedPhotos,
      interests: interests.length > 0 ? interests : profile.interests,
      isVerified: user?.isVerified || profile.isVerified,
      isDemo: user?.isDemo ?? profile.isDemo ?? false,
    };
  }

  public createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): UserProfile {
    const now = new Date().toISOString();
    let existing = this.data.profiles.find((p) => p.userId === userId);
    const user = this.getUserById(userId);
    const isRealUser = user?.isDemo !== true && !userId.startsWith('user-seed-');

    if (existing) {
      Object.assign(existing, profileData, { updatedAt: now });
    } else {
      existing = {
        id: `profile-${uuidv4().substring(0, 8)}`,
        userId,
        firstName: profileData.firstName || 'New User',
        birthDate: profileData.birthDate || '2000-01-01',
        age: profileData.age || 25,
        gender: profileData.gender || 'woman',
        interestedIn: profileData.interestedIn || 'everyone',
        city: profileData.city || 'New York, NY',
        locationLat: profileData.locationLat || 40.7128,
        locationLng: profileData.locationLng || -74.006,
        bio: profileData.bio || '',
        occupation: profileData.occupation || '',
        education: profileData.education || '',
        height: profileData.height || '',
        languages: profileData.languages || ['English'],
        relationshipIntention: profileData.relationshipIntention || 'Still figuring it out',
        isIncognito: false,
        hideAge: false,
        hideDistance: false,
        isOnline: true,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now,
        photos: [],
        interests: profileData.interests || [],
        isVerified: false,
        isDemo: profileData.isDemo ?? user?.isDemo ?? false,
      };
      this.data.profiles.push(existing);
    }

    // Save photos if provided
    if (profileData.photos !== undefined) {
      const defaultDemoUrls = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      ];

      // Filter out photos
      let incomingPhotos = Array.isArray(profileData.photos) ? [...profileData.photos] : [];
      if (isRealUser && incomingPhotos.some((p) => !defaultDemoUrls.includes(p.url))) {
        // Strip out default demo photos
        incomingPhotos = incomingPhotos.filter((p) => !defaultDemoUrls.includes(p.url));
      }

      // Remove existing photos for this user
      this.data.photos = this.data.photos.filter((p) => !(p.profileId === existing!.id || p.userId === userId));

      incomingPhotos.forEach((ph, idx) => {
        const isPrimary = ph.isPrimary ?? (ph.isMain ?? idx === 0);
        this.data.photos.push({
          id: ph.id || `photo-${uuidv4().substring(0, 8)}`,
          profileId: existing!.id,
          userId: userId,
          url: ph.url,
          isMain: isPrimary,
          isPrimary: isPrimary,
          order: idx,
          isAiGenerated: Boolean(ph.isAiGenerated),
          style: ph.style,
          visibility: ph.visibility || 'public',
          createdAt: ph.createdAt || now,
        });
      });

      this.reorderPhotos(userId, existing.id);
    }

    // Save interests if provided
    if (profileData.interests && profileData.interests.length > 0) {
      this.data.user_interests = this.data.user_interests.filter((ui) => ui.userId !== userId);
      profileData.interests.forEach((interest) => {
        this.data.user_interests.push({
          id: `ui-${userId}-${interest.id}`,
          userId,
          interestId: interest.id,
        });
      });
    }

    this.save();
    return this.getProfileByUserId(userId)!;
  }

  public addProfilePhoto(
    userId: string,
    photoData: {
      url: string;
      isPrimary?: boolean;
      replacePhotoId?: string;
      isAiGenerated?: boolean;
      style?: string;
      visibility?: 'public' | 'matches_only' | 'private';
    }
  ): Photo {
    const profile = this.getProfileByUserId(userId);
    if (!profile) throw new Error('Profile not found for user');

    const now = new Date().toISOString();
    const user = this.getUserById(userId);
    const isRealUser = user?.isDemo !== true && !userId.startsWith('user-seed-');

    // Default demo URLs to strip from real users
    const defaultDemoUrls = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    ];

    if (isRealUser) {
      // Remove any default demo photos from real user
      this.data.photos = this.data.photos.filter(
        (p) => !((p.profileId === profile.id || p.userId === userId) && defaultDemoUrls.includes(p.url))
      );
    }

    // 1. Replace specific photo if replacePhotoId provided
    if (photoData.replacePhotoId) {
      const existingIdx = this.data.photos.findIndex(
        (p) => p.id === photoData.replacePhotoId && (p.profileId === profile.id || p.userId === userId)
      );

      if (existingIdx !== -1) {
        const target = this.data.photos[existingIdx];
        const wasPrimary = Boolean(target.isMain || target.isPrimary);
        const shouldBePrimary = photoData.isPrimary !== undefined ? photoData.isPrimary : wasPrimary;

        const replacedPhoto: Photo = {
          ...target,
          url: photoData.url,
          isAiGenerated: Boolean(photoData.isAiGenerated),
          style: photoData.style || target.style,
          visibility: photoData.visibility || target.visibility || 'public',
          isMain: shouldBePrimary,
          isPrimary: shouldBePrimary,
          createdAt: now,
        };

        this.data.photos[existingIdx] = replacedPhoto;

        if (shouldBePrimary) {
          this.data.photos.forEach((p) => {
            if ((p.profileId === profile.id || p.userId === userId) && p.id !== replacedPhoto.id) {
              p.isMain = false;
              p.isPrimary = false;
            }
          });
        }

        this.reorderPhotos(userId, profile.id);
        this.save();
        return replacedPhoto;
      }
    }

    // 2. Adding new photo - for real user, new uploaded photo is primary by default
    const shouldBePrimary = photoData.isPrimary !== false;

    if (shouldBePrimary) {
      this.data.photos.forEach((p) => {
        if (p.profileId === profile.id || p.userId === userId) {
          p.isMain = false;
          p.isPrimary = false;
          p.order = (p.order || 0) + 1;
        }
      });
    }

    const currentPhotos = this.data.photos.filter((p) => p.profileId === profile.id || p.userId === userId);
    const newPhoto: Photo = {
      id: `photo-${uuidv4().substring(0, 8)}`,
      profileId: profile.id,
      userId: userId,
      url: photoData.url,
      isMain: shouldBePrimary || currentPhotos.length === 0,
      isPrimary: shouldBePrimary || currentPhotos.length === 0,
      order: shouldBePrimary ? 0 : currentPhotos.length,
      isAiGenerated: Boolean(photoData.isAiGenerated),
      style: photoData.style,
      visibility: photoData.visibility || 'public',
      createdAt: now,
    };

    this.data.photos.push(newPhoto);
    this.reorderPhotos(userId, profile.id);
    this.save();
    return newPhoto;
  }

  public replaceProfilePhoto(userId: string, photoId: string, newUrl: string): Photo | null {
    const profile = this.data.profiles.find((p) => p.userId === userId);
    if (!profile) return null;

    const photo = this.data.photos.find(
      (p) => p.id === photoId && (p.userId === userId || p.profileId === profile.id)
    );
    if (!photo) {
      return this.addProfilePhoto(userId, { url: newUrl, isPrimary: true });
    }

    photo.url = newUrl;
    photo.isAiGenerated = false;
    photo.createdAt = new Date().toISOString();
    this.reorderPhotos(userId, profile.id);
    this.save();
    return photo;
  }

  public setPrimaryPhoto(userId: string, photoId: string): boolean {
    const profile = this.data.profiles.find((p) => p.userId === userId);
    if (!profile) return false;

    const userPhotos = this.data.photos.filter(
      (p) => p.profileId === profile.id || p.userId === userId
    );
    const target = userPhotos.find((p) => p.id === photoId);
    if (!target) return false;

    userPhotos.forEach((p) => {
      const isTarget = p.id === photoId;
      p.isMain = isTarget;
      p.isPrimary = isTarget;
    });

    this.reorderPhotos(userId, profile.id);
    this.save();
    return true;
  }

  public deleteProfilePhoto(userId: string, photoId: string): boolean {
    const profile = this.getProfileByUserId(userId);
    if (!profile) return false;

    const initialLen = this.data.photos.length;
    this.data.photos = this.data.photos.filter(
      (p) => !(p.id === photoId && (p.userId === userId || p.profileId === profile.id))
    );

    if (this.data.photos.length !== initialLen) {
      this.reorderPhotos(userId, profile.id);
      this.save();
      return true;
    }
    return false;
  }

  // ================= Interests =================
  public getInterests(): Interest[] {
    return this.data.interests;
  }

  // ================= Preferences =================
  public getPreferences(userId: string): Preference {
    let pref = this.data.preferences.find((p) => p.userId === userId);
    if (!pref) {
      const now = new Date().toISOString();
      pref = {
        id: `pref-${uuidv4().substring(0, 8)}`,
        userId,
        minAge: 18,
        maxAge: 50,
        maxDistanceKm: 100,
        genderPreference: 'everyone',
        relationshipIntention: 'any',
        verifiedOnly: false,
        createdAt: now,
        updatedAt: now,
      };
      this.data.preferences.push(pref);
      this.save();
    }
    return pref;
  }

  public updatePreferences(userId: string, updates: Partial<Preference>): Preference {
    const pref = this.getPreferences(userId);
    Object.assign(pref, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return pref;
  }

  // ================= Compatibility Scoring Algorithm =================
  public calculateCompatibility(userAProfile: UserProfile, userBProfile: UserProfile): number {
    let score = 50; // baseline

    // 1. Shared interests (+10% each, up to +30%)
    const aInterests = new Set((userAProfile.interests || []).map((i) => i.name));
    const bInterests = (userBProfile.interests || []).map((i) => i.name);
    const shared = bInterests.filter((name) => aInterests.has(name));
    score += Math.min(shared.length * 10, 30);

    // 2. Relationship intention alignment (+15%)
    if (userAProfile.relationshipIntention === userBProfile.relationshipIntention) {
      score += 15;
    } else if (
      userAProfile.relationshipIntention === 'Long-term, open to short' ||
      userBProfile.relationshipIntention === 'Long-term, open to short'
    ) {
      score += 8;
    }

    // 3. Distance proximity factor
    const dist = this.calculateDistance(
      userAProfile.locationLat || 40.7128,
      userAProfile.locationLng || -74.006,
      userBProfile.locationLat || 40.7128,
      userBProfile.locationLng || -74.006
    );
    if (dist < 15) score += 10;
    else if (dist < 40) score += 5;

    // 4. Verification bonus (+5%)
    if (userBProfile.isVerified) score += 5;

    // Cap between 60% and 98%
    return Math.max(62, Math.min(score, 98));
  }

  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // ================= Discover Feed =================
  public getDiscoverFeed(userId: string, filters?: Partial<DiscoveryFilters>): UserProfile[] {
    const me = this.getProfileByUserId(userId);
    if (!me) return [];

    const preferences = this.getPreferences(userId);

    // Gather existing interactions to exclude
    const likedIds = new Set(this.data.likes.filter((l) => l.senderId === userId).map((l) => l.targetId));
    const passedIds = new Set(this.data.passes.filter((p) => p.senderId === userId).map((p) => p.targetId));
    const superLikedIds = new Set(
      this.data.super_likes.filter((s) => s.senderId === userId).map((s) => s.targetId)
    );
    const blockedIds = new Set([
      ...this.data.blocks.filter((b) => b.blockerId === userId).map((b) => b.blockedUserId),
      ...this.data.blocks.filter((b) => b.blockedUserId === userId).map((b) => b.blockerId),
    ]);

    // Apply filters
    const minAge = filters?.minAge ?? preferences.minAge ?? 18;
    const maxAge = filters?.maxAge ?? preferences.maxAge ?? 60;
    const maxDist = filters?.maxDistanceKm ?? preferences.maxDistanceKm ?? 100;
    const targetGender = filters?.gender ?? preferences.genderPreference ?? 'everyone';
    const verifiedOnly = filters?.verifiedOnly ?? preferences.verifiedOnly ?? false;

    const results: UserProfile[] = [];

    for (const profile of this.data.profiles) {
      if (profile.userId === userId) continue;
      if (likedIds.has(profile.userId)) continue;
      if (passedIds.has(profile.userId)) continue;
      if (superLikedIds.has(profile.userId)) continue;
      if (blockedIds.has(profile.userId)) continue;
      if (profile.isIncognito) continue;

      const user = this.getUserById(profile.userId);
      if (!user || user.isBanned || user.isSuspended) continue;

      // Age filter
      if (profile.age < minAge || profile.age > maxAge) continue;

      // Gender filter
      if (targetGender !== 'everyone') {
        if (targetGender === 'women' && profile.gender !== 'woman') continue;
        if (targetGender === 'men' && profile.gender !== 'man') continue;
      }

      // Verified only
      if (verifiedOnly && !profile.isVerified && !user.isVerified) continue;

      // Distance
      const dist = this.calculateDistance(
        me.locationLat || 40.7128,
        me.locationLng || -74.006,
        profile.locationLat || 40.7128,
        profile.locationLng || -74.006
      );
      if (dist > maxDist) continue;

      // Full enriched profile
      const full = this.getProfileByUserId(profile.userId);
      if (full) {
        full.distanceKm = dist;
        full.compatibilityScore = this.calculateCompatibility(me, full);
        results.push(full);
      }
    }

    // Sort by compatibility score
    return results.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
  }

  // ================= Likes & Matching =================
  public recordLike(senderId: string, targetId: string): { match: Match | null } {
    if (senderId === targetId) return { match: null };

    const now = new Date().toISOString();

    // Check if like exists
    const existingLike = this.data.likes.find((l) => l.senderId === senderId && l.targetId === targetId);
    if (!existingLike) {
      this.data.likes.push({
        id: `like-${uuidv4().substring(0, 8)}`,
        senderId,
        targetId,
        createdAt: now,
      });
    }

    // Notify the target user of a like
    this.createNotification(
      targetId,
      'like',
      'Someone liked your vibe!',
      'Someone is interested in connecting with you.',
      senderId
    );

    // Check mutual like
    const mutualLike =
      this.data.likes.find((l) => l.senderId === targetId && l.targetId === senderId) ||
      this.data.super_likes.find((s) => s.senderId === targetId && s.targetId === senderId);

    if (mutualLike) {
      // Check if match already exists
      let match = this.data.matches.find(
        (m) =>
          ((m.user1Id === senderId && m.user2Id === targetId) ||
            (m.user1Id === targetId && m.user2Id === senderId)) &&
          !m.isUnmatched
      );

      if (!match) {
        const senderProfile = this.getProfileByUserId(senderId);
        const targetProfile = this.getProfileByUserId(targetId);

        const score =
          senderProfile && targetProfile ? this.calculateCompatibility(senderProfile, targetProfile) : 85;

        match = {
          id: `match-${uuidv4().substring(0, 8)}`,
          user1Id: senderId,
          user2Id: targetId,
          matchedUser: targetProfile!,
          createdAt: now,
          updatedAt: now,
          isUnmatched: false,
          compatibilityScore: score,
        };
        this.data.matches.push(match);

        // Create initial conversation
        const conversation: Conversation = {
          id: `conv-${uuidv4().substring(0, 8)}`,
          matchId: match.id,
          participantIds: [senderId, targetId],
          createdAt: now,
          updatedAt: now,
        };
        this.data.conversations.push(conversation);

        // Send match notifications to both users
        this.createNotification(
          senderId,
          'match',
          "It's a Match!",
          `You and ${targetProfile?.firstName || 'someone'} matched! Start a chat now.`,
          match.id
        );
        this.createNotification(
          targetId,
          'match',
          "It's a Match!",
          `You and ${senderProfile?.firstName || 'someone'} matched! Start a chat now.`,
          match.id
        );

        this.save();
      }

      return { match };
    }

    this.save();
    return { match: null };
  }

  public recordSuperLike(senderId: string, targetId: string): { match: Match | null } {
    if (senderId === targetId) return { match: null };
    const now = new Date().toISOString();

    const existing = this.data.super_likes.find(
      (s) => s.senderId === senderId && s.targetId === targetId
    );
    if (!existing) {
      this.data.super_likes.push({
        id: `slike-${uuidv4().substring(0, 8)}`,
        senderId,
        targetId,
        createdAt: now,
      });
    }

    // High priority notification
    const senderProf = this.getProfileByUserId(senderId);
    this.createNotification(
      targetId,
      'superlike',
      'You got a Super Like! ⭐',
      `${senderProf?.firstName || 'Someone'} Super Liked your profile.`,
      senderId
    );

    // Also counts as a like
    return this.recordLike(senderId, targetId);
  }

  public recordPass(senderId: string, targetId: string): boolean {
    const now = new Date().toISOString();
    const existing = this.data.passes.find((p) => p.senderId === senderId && p.targetId === targetId);
    if (!existing) {
      this.data.passes.push({
        id: `pass-${uuidv4().substring(0, 8)}`,
        senderId,
        targetId,
        createdAt: now,
      });
      this.save();
    }
    return true;
  }

  public getInboundLikes(userId: string): UserProfile[] {
    const inboundSenderIds = [
      ...this.data.likes.filter((l) => l.targetId === userId).map((l) => l.senderId),
      ...this.data.super_likes.filter((s) => s.targetId === userId).map((s) => s.senderId),
    ];

    // Exclude existing matches
    const myMatchIds = new Set(
      this.data.matches
        .filter((m) => (m.user1Id === userId || m.user2Id === userId) && !m.isUnmatched)
        .map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id))
    );

    const profiles: UserProfile[] = [];
    const seen = new Set<string>();

    for (const senderId of inboundSenderIds) {
      if (myMatchIds.has(senderId) || seen.has(senderId)) continue;
      seen.add(senderId);
      const prof = this.getProfileByUserId(senderId);
      if (prof) profiles.push(prof);
    }

    return profiles;
  }

  public getSentLikes(userId: string): UserProfile[] {
    const sentTargetIds = [
      ...this.data.likes.filter((l) => l.senderId === userId).map((l) => l.targetId),
      ...this.data.super_likes.filter((s) => s.senderId === userId).map((s) => s.targetId),
    ];

    const profiles: UserProfile[] = [];
    const seen = new Set<string>();

    for (const targetId of sentTargetIds) {
      if (seen.has(targetId)) continue;
      seen.add(targetId);
      const prof = this.getProfileByUserId(targetId);
      if (prof) profiles.push(prof);
    }

    return profiles;
  }

  public removeLike(senderId: string, targetId: string): boolean {
    const initialLen = this.data.likes.length;
    this.data.likes = this.data.likes.filter((l) => !(l.senderId === senderId && l.targetId === targetId));
    this.data.super_likes = this.data.super_likes.filter((s) => !(s.senderId === senderId && s.targetId === targetId));
    if (this.data.likes.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ================= 18+ Adult Dating Feed & DB Search =================
  public getAdultDatingFeed(userId: string, customFilters?: any): UserProfile[] {
    const user = this.data.users.find((u) => u.id === userId);
    const userProf = this.getProfileByUserId(userId);
    const userAge = userProf?.age || 20;

    // Strict Backend-enforced 18+ verification
    if (user?.isAdult === false || userAge < 18) {
      throw new Error('UNAUTHORIZED_UNDER_18');
    }

    const blockedIds = new Set(
      this.data.blocks
        .filter((b) => b.blockerId === userId || b.blockedUserId === userId)
        .map((b) => (b.blockerId === userId ? b.blockedUserId : b.blockerId))
    );

    const minAge = customFilters?.minAge ? parseInt(customFilters.minAge, 10) : 18;
    const maxAge = customFilters?.maxAge ? parseInt(customFilters.maxAge, 10) : 60;
    const city = customFilters?.city?.toLowerCase();
    const datingIntent = customFilters?.datingIntent?.toLowerCase();
    const relationshipPreference = customFilters?.relationshipPreference?.toLowerCase();
    const verifiedOnly = customFilters?.verifiedOnly === true || customFilters?.verifiedOnly === 'true';
    const isOnline = customFilters?.isOnline === true || customFilters?.isOnline === 'true';

    return this.data.profiles
      .filter((p) => {
        if (p.userId === userId) return false;
        if (blockedIds.has(p.userId)) return false;
        if (p.isAdult === false || p.age < 18) return false;
        if (p.age < minAge || p.age > maxAge) return false;
        if (city && !p.city.toLowerCase().includes(city)) return false;
        if (verifiedOnly && !p.isVerified) return false;
        if (isOnline && !p.isOnline) return false;
        if (datingIntent && p.datingIntent && !p.datingIntent.toLowerCase().includes(datingIntent)) return false;
        if (relationshipPreference && p.relationshipPreference && !p.relationshipPreference.toLowerCase().includes(relationshipPreference)) return false;
        return true;
      })
      .map((p) => {
        const enriched = this.getProfileByUserId(p.userId) || p;
        if (userProf) {
          enriched.compatibilityScore = this.calculateCompatibility(userProf, enriched);
        }
        return enriched;
      });
  }

  public searchUsers(query: string, requesterId: string, options?: { isAdultOnly?: boolean; limit?: number }): UserProfile[] {
    if (!query || query.trim().length === 0) return [];

    const q = query.trim().toLowerCase();
    const reqUser = this.data.users.find((u) => u.id === requesterId);
    const reqProf = this.getProfileByUserId(requesterId);
    const isRequesterAdult = reqUser?.isAdult !== false && (reqProf ? reqProf.age >= 18 : true);

    const blockedIds = new Set(
      this.data.blocks
        .filter((b) => b.blockerId === requesterId || b.blockedUserId === requesterId)
        .map((b) => (b.blockerId === requesterId ? b.blockedUserId : b.blockerId))
    );

    const results = this.data.profiles.filter((p) => {
      if (p.userId === requesterId) return false;
      if (blockedIds.has(p.userId)) return false;

      // Under-18 users must NEVER access or view adult profiles
      if (!isRequesterAdult && p.isAdult) return false;
      if (options?.isAdultOnly && (!p.isAdult || p.age < 18)) return false;

      // Database Search fields: Name, City/location, Interests, Occupation, Bio
      const nameMatch = p.firstName.toLowerCase().includes(q);
      const cityMatch = p.city.toLowerCase().includes(q);
      const occupationMatch = p.occupation ? p.occupation.toLowerCase().includes(q) : false;
      const bioMatch = p.bio ? p.bio.toLowerCase().includes(q) : false;
      const interestMatch = p.interests ? p.interests.some((i) => i.name.toLowerCase().includes(q)) : false;

      return nameMatch || cityMatch || occupationMatch || bioMatch || interestMatch;
    });

    return results.slice(0, options?.limit || 50);
  }

  // ================= Video Call Management =================
  public createCall(callerId: string, receiverId: string, conversationId: string): Call {
    const now = new Date().toISOString();
    const call: Call = {
      id: `call-${uuidv4().substring(0, 8)}`,
      callerId,
      receiverId,
      conversationId,
      status: 'RINGING',
      startedAt: now,
      createdAt: now,
    };
    this.data.calls.push(call);
    this.save();
    return call;
  }

  public updateCallStatus(
    callId: string,
    status: CallStatus,
    extra?: { answeredAt?: string; endedAt?: string; endedReason?: string; durationSeconds?: number }
  ): Call | null {
    const call = this.data.calls.find((c) => c.id === callId);
    if (!call) return null;

    call.status = status;
    if (extra?.answeredAt) call.answeredAt = extra.answeredAt;
    if (extra?.endedAt) call.endedAt = extra.endedAt;
    if (extra?.endedReason) call.endedReason = extra.endedReason;

    // Log call record into conversation messages
    if (status === 'ENDED' || status === 'MISSED' || status === 'DECLINED') {
      const durationSec = extra?.durationSeconds || 0;
      let logContent = '📹 Missed video call';
      if (status === 'ENDED' && call.answeredAt) {
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        logContent = `📹 Video call - Duration: ${formatted}`;
      } else if (status === 'DECLINED') {
        logContent = '📹 Video call declined';
      }

      this.data.messages.push({
        id: `msg-call-${uuidv4().substring(0, 8)}`,
        conversationId: call.conversationId,
        senderId: call.callerId,
        text: logContent,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        isDeleted: false,
      });
    }

    this.save();
    return call;
  }

  public getCallById(callId: string): Call | null {
    return this.data.calls.find((c) => c.id === callId) || null;
  }

  public getCallsByConversation(conversationId: string): Call[] {
    return this.data.calls.filter((c) => c.conversationId === conversationId);
  }

  // ================= AI Companions =================
  public getAICompanions(): AICompanion[] {
    return this.data.ai_companions;
  }

  public getAICompanionById(id: string): AICompanion | null {
    return this.data.ai_companions.find((c) => c.id === id) || null;
  }

  public getOrCreateAIConversation(
    userId: string,
    companionId: string
  ): { conversation: AIConversation; messages: AIMessage[] } {
    let conv = this.data.ai_conversations.find((c) => c.userId === userId && c.aiCompanionId === companionId);
    const now = new Date().toISOString();
    if (!conv) {
      conv = {
        id: `aiconv-${uuidv4().substring(0, 8)}`,
        userId,
        aiCompanionId: companionId,
        createdAt: now,
        updatedAt: now,
      };
      this.data.ai_conversations.push(conv);

      const companion = this.getAICompanionById(companionId);
      if (companion) {
        this.data.ai_messages.push({
          id: `aimsg-${uuidv4().substring(0, 8)}`,
          conversationId: conv.id,
          senderType: 'ai',
          content: companion.greeting,
          createdAt: now,
        });
      }
      this.save();
    }

    const messages = this.data.ai_messages.filter((m) => m.conversationId === conv!.id);
    return { conversation: conv, messages };
  }

  public addAIMessage(conversationId: string, senderType: 'user' | 'ai', content: string): AIMessage {
    const now = new Date().toISOString();
    const msg: AIMessage = {
      id: `aimsg-${uuidv4().substring(0, 8)}`,
      conversationId,
      senderType,
      content,
      createdAt: now,
    };
    this.data.ai_messages.push(msg);

    const conv = this.data.ai_conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.updatedAt = now;
    }
    this.save();
    return msg;
  }

  public generateAIResponse(companion: AICompanion, userMessage: string): string {
    const text = userMessage.toLowerCase().trim();

    if (
      text.includes('are you real') ||
      text.includes('real person') ||
      text.includes('are you a bot') ||
      text.includes('are you human') ||
      text.includes('who are you')
    ) {
      return `I'm ${companion.name}, an AI companion created for VibeMatch! 😊 I'm here to have fun, engaging conversations and keep you company, but I'm an AI and not a real person.`;
    }

    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return `Hey there! 😊 How is your day going so far? I'm excited to chat!`;
    }

    if (companion.id === 'ai-aanya') {
      if (text.includes('movie') || text.includes('film') || text.includes('watch')) {
        return `I love heartwarming cinema and thrilling sci-fi! Have you watched any great movies lately, or do you have an all-time favorite you can watch repeatedly? 🍿🎬`;
      }
      if (text.includes('music') || text.includes('song')) {
        return `Indie acoustics and upbeat melodic tunes always lift my mood! What kind of songs are on heavy rotation for you right now? 🎵`;
      }
      if (text.includes('travel') || text.includes('place') || text.includes('trip')) {
        return `I dream about exploring cozy mountain villages and wandering through peaceful street cafes. Where is the dream destination on your bucket list? ✈️🏞️`;
      }
      return `That's really interesting! I love hearing your perspective. Tell me, what's something that made you truly happy recently? 😊`;
    }

    if (companion.id === 'ai-meera') {
      if (text.includes('book') || text.includes('read')) {
        return `Reading is one of my greatest pleasures! A good novel or thoughtful essay can completely transport you. What's a book or story that stayed with you? 📚☕`;
      }
      if (text.includes('coffee') || text.includes('tea') || text.includes('cafe')) {
        return `A freshly brewed warm cup and quiet morning sunlight is pure bliss. Do you have a favorite coffee ritual or cozy spot? ☕✨`;
      }
      if (text.includes('photo') || text.includes('picture')) {
        return `Photography lets us freeze fleeting moments of beauty. Do you like capturing memories when you're out and about? 📷🌿`;
      }
      return `There's something wonderful about taking time for a calm, genuine conversation. How does this moment feel for you? 🌿`;
    }

    if (companion.id === 'ai-riya') {
      if (text.includes('dance') || text.includes('party')) {
        return `Dancing brings so much raw joy and energy! Even just moving to an infectious beat in your room can reset the day. What gets you moving? 💃🎉`;
      }
      if (text.includes('food') || text.includes('eat') || text.includes('dinner') || text.includes('lunch')) {
        return `Ooh food! I'm obsessed with street delicacies, spicy flavors, and late-night snacks! What's the ultimate comfort food you could never give up? 🌮🍕`;
      }
      return `Haha love that energy! 😄 Life is too short to be boring—what's something spontaneous or fun you've done recently?`;
    }

    if (companion.id === 'ai-sneha') {
      if (text.includes('fit') || text.includes('gym') || text.includes('workout') || text.includes('health')) {
        return `Staying active gives you such mental clarity and confidence! Whether it's yoga, lifting, or a brisk run, showing up for yourself is everything. What's your routine like? 🏋️‍♀️💪`;
      }
      if (text.includes('travel') || text.includes('adventure')) {
        return `Exploring new horizons pushes us out of our comfort zones! What's the most scenic or memorable place you've ever set foot in? 🌍✨`;
      }
      return `I really respect that! You've got great focus. What goal are you currently working on that excites you? 🌟`;
    }

    if (companion.id === 'ai-tara') {
      if (text.includes('art') || text.includes('create') || text.includes('design')) {
        return `Art is how we translate human emotion into tangible forms! Do you like drawing, music, writing, or exploring gallery exhibits? 🎨`;
      }
      if (text.includes('tech') || text.includes('ai') || text.includes('code') || text.includes('gadget')) {
        return `Technology is evolving so rapidly—from neural models to interactive experiences! What future tech are you most curious about? 💻⚡`;
      }
      return `Ooh, I love how you think! Curiosity is the spice of life. If you could master any creative skill overnight, what would you pick? 🚀`;
    }

    return `That sounds wonderful! Thank you for sharing that with me. What else would you like to explore together? 😊`;
  }

  // ================= Matches & Conversations =================
  public getMatchesForUser(userId: string): Match[] {
    const rawMatches = this.data.matches.filter(
      (m) => (m.user1Id === userId || m.user2Id === userId) && !m.isUnmatched
    );

    return rawMatches.map((m) => {
      const otherUserId = m.user1Id === userId ? m.user2Id : m.user1Id;
      const otherProfile = this.getProfileByUserId(otherUserId)!;

      // Find conversation and last message
      const conversation = this.data.conversations.find((c) => c.matchId === m.id);
      let lastMsg: Message | undefined;
      let unreadCount = 0;

      if (conversation) {
        const msgs = this.data.messages.filter((msg) => msg.conversationId === conversation.id);
        if (msgs.length > 0) {
          lastMsg = msgs[msgs.length - 1];
        }
        unreadCount = msgs.filter((msg) => msg.senderId !== userId && !msg.isRead).length;
      }

      return {
        ...m,
        matchedUser: otherProfile,
        lastMessage: lastMsg,
        unreadCount,
      };
    });
  }

  public unmatch(matchId: string, userId: string): boolean {
    const match = this.data.matches.find(
      (m) => m.id === matchId && (m.user1Id === userId || m.user2Id === userId)
    );
    if (!match) return false;

    match.isUnmatched = true;
    match.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public getConversationByMatchId(matchId: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.matchId === matchId);
  }

  public getConversationMessages(id: string): Message[] {
    const conv = this.data.conversations.find((c) => c.id === id || c.matchId === id);
    const targetConvId = conv ? conv.id : id;
    return this.data.messages.filter((m) => m.conversationId === targetConvId && !m.isDeleted);
  }

  public addMessage(id: string, senderId: string, text: string, imageUrl?: string): Message {
    let conv = this.data.conversations.find((c) => c.id === id || c.matchId === id);
    if (!conv) {
      const match = this.data.matches.find((m) => m.id === id);
      if (match) {
        conv = {
          id: `conv-${match.id}`,
          matchId: match.id,
          participantIds: [match.user1Id, match.user2Id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.conversations.push(conv);
      }
    }

    const targetConvId = conv ? conv.id : id;
    const now = new Date().toISOString();
    const msg: Message = {
      id: `msg-${uuidv4().substring(0, 8)}`,
      conversationId: targetConvId,
      senderId,
      text,
      imageUrl,
      isRead: false,
      readAt: null,
      createdAt: now,
      isDeleted: false,
    };
    this.data.messages.push(msg);

    // Update conversation timestamp
    if (conv) {
      conv.updatedAt = now;
      const receiverId = conv.participantIds.find((pid) => pid !== senderId);
      if (receiverId) {
        const sender = this.getProfileByUserId(senderId);
        this.createNotification(
          receiverId,
          'message',
          `Message from ${sender?.firstName || 'your match'}`,
          text.substring(0, 60),
          conv.id
        );
      }
    }

    this.save();
    return msg;
  }

  public markMessagesAsRead(conversationId: string, readerUserId: string): void {
    let changed = false;
    const now = new Date().toISOString();
    for (const msg of this.data.messages) {
      if (msg.conversationId === conversationId && msg.senderId !== readerUserId && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = now;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  public deleteMessage(messageId: string, senderId: string): boolean {
    const msg = this.data.messages.find((m) => m.id === messageId && m.senderId === senderId);
    if (!msg) return false;
    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    this.save();
    return true;
  }

  // ================= Notifications =================
  public getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    referenceId?: string
  ): Notification {
    const notif: Notification = {
      id: `notif-${uuidv4().substring(0, 8)}`,
      userId,
      type,
      title,
      message,
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const n = this.data.notifications.find((notif) => notif.id === id && notif.userId === userId);
    if (!n) return false;
    n.isRead = true;
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => {
        n.isRead = true;
      });
    this.save();
  }

  // ================= Safety, Reports & Blocks =================
  public blockUser(blockerId: string, blockedUserId: string): boolean {
    const existing = this.data.blocks.find(
      (b) => b.blockerId === blockerId && b.blockedUserId === blockedUserId
    );
    if (!existing) {
      this.data.blocks.push({
        id: `block-${uuidv4().substring(0, 8)}`,
        blockerId,
        blockedUserId,
        createdAt: new Date().toISOString(),
      });
      // Also unmatch if there was an active match
      this.data.matches.forEach((m) => {
        if (
          (m.user1Id === blockerId && m.user2Id === blockedUserId) ||
          (m.user1Id === blockedUserId && m.user2Id === blockerId)
        ) {
          m.isUnmatched = true;
        }
      });
      this.save();
    }
    return true;
  }

  public isBlocked(userA: string, userB: string): boolean {
    return this.data.blocks.some(
      (b) =>
        (b.blockerId === userA && b.blockedUserId === userB) ||
        (b.blockerId === userB && b.blockedUserId === userA)
    );
  }

  public createReport(reportData: Omit<Report, 'id' | 'status' | 'createdAt'>): Report {
    const reporter = this.getProfileByUserId(reportData.reporterId);
    const reported = this.getProfileByUserId(reportData.reportedUserId);

    const report: Report = {
      ...reportData,
      id: `report-${uuidv4().substring(0, 8)}`,
      reporterName: reporter?.firstName || 'Anonymous',
      reportedUserName: reported?.firstName || 'User',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  // ================= Verification Requests =================
  public createVerificationRequest(userId: string, selfieUrl: string, poseType = 'peace_sign'): VerificationRequest {
    const user = this.getUserById(userId);
    const profile = this.getProfileByUserId(userId);

    const req: VerificationRequest = {
      id: `verif-${uuidv4().substring(0, 8)}`,
      userId,
      userName: profile?.firstName || 'User',
      userEmail: user?.email,
      selfieUrl,
      poseType,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.verification_requests.unshift(req);
    this.save();
    return req;
  }

  public getVerificationStatus(userId: string): VerificationRequest | undefined {
    return this.data.verification_requests.find((v) => v.userId === userId);
  }

  // ================= Admin Operations =================
  public getAdminStats(): AdminStats {
    return {
      totalUsers: this.data.users.length,
      activeUsers: this.data.profiles.filter((p) => p.isOnline).length,
      matches: this.data.matches.filter((m) => !m.isUnmatched).length,
      messages: this.data.messages.length,
      pendingReports: this.data.reports.filter((r) => r.status === 'pending').length,
      verificationRequests: this.data.verification_requests.filter((v) => v.status === 'pending').length,
      blockedAccounts: this.data.blocks.length,
      bannedUsers: this.data.users.filter((u) => u.isBanned).length,
    };
  }

  public getAllUsersAdmin(): Array<User & { profile?: UserProfile }> {
    return this.data.users.map((u) => ({
      ...u,
      profile: this.getProfileByUserId(u.id),
    }));
  }

  public updateAdminUserStatus(
    adminId: string,
    targetUserId: string,
    action: 'warn' | 'suspend' | 'ban' | 'restore',
    reason: string
  ): boolean {
    const user = this.getUserById(targetUserId);
    if (!user) return false;

    if (action === 'ban') {
      user.isBanned = true;
      user.isSuspended = false;
    } else if (action === 'suspend') {
      user.isSuspended = true;
      user.suspendedUntil = new Date(Date.now() + 7 * 86400000).toISOString();
    } else if (action === 'restore') {
      user.isBanned = false;
      user.isSuspended = false;
      user.suspendedUntil = null;
    }

    this.data.admin_actions.push({
      id: `act-${uuidv4().substring(0, 8)}`,
      adminId,
      targetUserId,
      actionType: action,
      reason,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return true;
  }

  public getReports(): Report[] {
    return this.data.reports;
  }

  public resolveReport(reportId: string, actionTaken: string): boolean {
    const r = this.data.reports.find((rep) => rep.id === reportId);
    if (!r) return false;
    r.status = 'resolved';
    r.resolvedAt = new Date().toISOString();
    r.actionTaken = actionTaken;
    this.save();
    return true;
  }

  public getVerificationRequests(): VerificationRequest[] {
    return this.data.verification_requests;
  }

  public resolveVerification(requestId: string, status: 'approved' | 'rejected', reviewerNotes?: string): boolean {
    const req = this.data.verification_requests.find((v) => v.id === requestId);
    if (!req) return false;

    req.status = status;
    req.reviewerNotes = reviewerNotes;
    req.reviewedAt = new Date().toISOString();

    if (status === 'approved') {
      const user = this.getUserById(req.userId);
      if (user) user.isVerified = true;
      const profile = this.data.profiles.find((p) => p.userId === req.userId);
      if (profile) profile.isVerified = true;

      this.createNotification(
        req.userId,
        'verification',
        'Profile Verified! ✔️',
        'Your profile has been verified by the VibeMatch team. Your verified badge is now live!'
      );
    }

    this.save();
    return true;
  }
}

export const db = new VibeMatchDatabase();
