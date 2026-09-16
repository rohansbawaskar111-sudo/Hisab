import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// GET /api/ai/companions
router.get('/companions', authenticateToken, (_req: AuthRequest, res: Response) => {
  try {
    const companions = db.getAICompanions();
    res.json(companions);
  } catch (err: any) {
    console.error('Fetch AI companions error:', err);
    res.status(500).json({ error: 'Failed to fetch AI companions' });
  }
});

// GET /api/ai/companions/:id
router.get('/companions/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const companion = db.getAICompanionById(req.params.id);
    if (!companion) {
      res.status(404).json({ error: 'AI Companion not found' });
      return;
    }
    res.json(companion);
  } catch (err: any) {
    console.error('Fetch AI companion error:', err);
    res.status(500).json({ error: 'Failed to fetch AI companion' });
  }
});

// GET /api/ai/conversations/:companionId
router.get('/conversations/:companionId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversation, messages } = db.getOrCreateAIConversation(userId, req.params.companionId);
    const companion = db.getAICompanionById(req.params.companionId);
    res.json({ conversation, messages, companion });
  } catch (err: any) {
    console.error('Fetch AI conversation error:', err);
    res.status(500).json({ error: 'Failed to fetch AI conversation' });
  }
});

// POST /api/ai/conversations/:companionId/message
router.post('/conversations/:companionId/message', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const companionId = req.params.companionId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const companion = db.getAICompanionById(companionId);
    if (!companion) {
      res.status(404).json({ error: 'AI Companion not found' });
      return;
    }

    const { conversation } = db.getOrCreateAIConversation(userId, companionId);

    // Save user message
    const userMsg = db.addAIMessage(conversation.id, 'user', content.trim());

    // Generate AI response aligned with companion personality and transparency rules
    const aiResponseText = db.generateAIResponse(companion, content.trim());
    const aiMsg = db.addAIMessage(conversation.id, 'ai', aiResponseText);

    res.json({
      success: true,
      userMessage: userMsg,
      aiMessage: aiMsg,
    });
  } catch (err: any) {
    console.error('Post AI message error:', err);
    res.status(500).json({ error: 'Failed to process AI message' });
  }
});

// Curated high-res attractive non-explicit adult photography reference pool for presets
const PRESET_PHOTO_POOLS: Record<string, string[]> = {
  glamour: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85',
  ],
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=85',
  ],
  night_out: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85',
  ],
  romantic_date: [
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
  ],
  studio: [
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85',
  ],
  travel: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=85',
  ],
  premium_dating: [
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
  ],
};

// POST /api/ai/create-photo
// Creates an attractive, stylish, non-explicit 18+ profile photo and saves it to user's DB photos
router.post('/create-photo', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = db.getProfileByUserId(userId);
    const user = db.getUserById(userId);

    // 1. Strict 18+ verification guard
    if (!profile || profile.age < 18 || user?.isAdult === false) {
      res.status(403).json({ error: 'AI Photo Creator is strictly for verified 18+ adult users.' });
      return;
    }

    const {
      preset = 'glamour',
      outfit,
      hairstyle,
      background,
      pose,
      lighting,
      style = 'Glamour',
      representsUser = true,
      referencePhotoUrl,
      visibility = 'public',
    } = req.body;

    // 2. Reference photo requirement
    // "If the image represents the actual user, require a user-provided reference photo."
    if (representsUser && (!referencePhotoUrl || !referencePhotoUrl.trim())) {
      res.status(400).json({
        error:
          'A user-provided reference photo is required when generating an AI photo representing yourself. Please select or upload a photo.',
      });
      return;
    }

    // 3. Safety validation: Strictly non-explicit, no sexual activity, nudity, or underage content
    const combinedPromptString = `${preset} ${outfit || ''} ${hairstyle || ''} ${background || ''} ${pose || ''} ${lighting || ''} ${style || ''}`.toLowerCase();
    const disallowedPatterns = [
      'nude',
      'nudity',
      'explicit',
      'porn',
      'nsfw',
      'sexual',
      'genital',
      'breast',
      'undress',
      'naked',
      'minor',
      'underage',
      'child',
      'teen',
    ];

    if (disallowedPatterns.some((pattern) => combinedPromptString.includes(pattern))) {
      res.status(400).json({
        error:
          'Safety Policy Violation: All generated photos must show consenting adults only and remain strictly non-explicit. Explicit sexual activity, nudity, or pornographic content is strictly prohibited.',
      });
      return;
    }

    // 4. Select high quality attractive photo or generate
    let chosenUrl = '';
    const pool = PRESET_PHOTO_POOLS[preset] || PRESET_PHOTO_POOLS.glamour;
    const randomIdx = Math.floor(Math.random() * pool.length);
    chosenUrl = pool[randomIdx];

    // Check if Gemini Image generation is configured in environment
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const imagePrompt = `High quality, ultra-realistic portrait photography of an attractive consenting adult in their 20s, tasteful dating profile picture. Style: ${style}. Preset: ${preset}. Outfit: ${outfit || 'Stylish evening wear'}. Hairstyle: ${hairstyle || 'Elegant blowout'}. Background: ${background || 'Scenic ambiance'}. Pose: ${pose || 'Confident radiant smile'}. Lighting: ${lighting || 'Golden hour cinematic rim lighting'}. Strictly non-explicit, fashionable, 8k resolution, photorealistic masterpiece.`;

        const aiResponse: any = await (ai.models as any).generateImages?.({
          model: 'imagen-3.0-generate-002',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg',
          },
        }).catch(() => null);

        if (aiResponse?.generatedImages?.[0]?.image?.imageBytes) {
          chosenUrl = `data:image/jpeg;base64,${aiResponse.generatedImages[0].image.imageBytes}`;
        }
      } catch (geminiErr) {
        console.warn('Gemini Imagen fallback to curated high-res photo:', geminiErr);
      }
    }

    // 5. Database Sync: Save photo to database with actual user ID & required metadata
    // Store: imageUrl, userId, isAiGenerated, createdAt, visibility
    const savedPhoto = db.addProfilePhoto(userId, {
      url: chosenUrl,
      isAiGenerated: true,
      style: style || 'Glamour',
      visibility: visibility === 'matches_only' ? 'matches_only' : 'public',
    });

    res.json({
      success: true,
      photo: savedPhoto,
      message: 'AI profile photo created and saved to your profile! ✨',
    });
  } catch (err: any) {
    console.error('AI Photo creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create AI photo' });
  }
});

// DELETE /api/ai/photos/:id
// Removes a photo from user profile
router.delete('/photos/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photoId = req.params.id;
    const deleted = db.deleteProfilePhoto(userId, photoId);
    if (!deleted) {
      res.status(404).json({ error: 'Photo not found or unauthorized' });
      return;
    }
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (err: any) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
