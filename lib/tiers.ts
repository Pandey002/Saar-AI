import { UserTier, StudyMode, LanguageMode } from "@/types";

export const TIER_PERMISSIONS = {
  free: {
    modes: ["summary"] as StudyMode[],
    tools: [] as string[],
    canDownloadPdf: false,
    canUseHinglish: false,
    canUseAdhyapak: false,
    canUseFlashcards: false,
    canUseLearningPath: false,
    maxLifetimeGenerations: 3,
    maxDailyInputs: 2,
  },
  student: {
    modes: ["summary", "explain", "assignment", "solve"] as StudyMode[],
    tools: ["pdf_download", "hinglish"],
    canDownloadPdf: true,
    canUseHinglish: true,
    canUseAdhyapak: false,
    canUseFlashcards: false,
    canUseLearningPath: false,
    maxLifetimeGenerations: Infinity,
    maxDailyInputs: Infinity,
  },
  achiever: {
    modes: ["summary", "explain", "assignment", "solve", "revision", "mocktest"] as StudyMode[],
    tools: ["pdf_download", "hinglish", "adhyapak", "flashcards", "performance"],
    canDownloadPdf: true,
    canUseHinglish: true,
    canUseAdhyapak: true,
    canUseFlashcards: true,
    canUseLearningPath: false,
    maxLifetimeGenerations: Infinity,
    maxDailyInputs: Infinity,
  },
  elite: {
    modes: ["summary", "explain", "assignment", "solve", "revision", "mocktest"] as StudyMode[],
    tools: ["pdf_download", "hinglish", "adhyapak", "flashcards", "performance", "learning_path"],
    canDownloadPdf: true,
    canUseHinglish: true,
    canUseAdhyapak: true,
    canUseFlashcards: true,
    canUseLearningPath: true,
    maxLifetimeGenerations: Infinity,
    maxDailyInputs: Infinity,
  },
} as const;

const TEST_EMAIL = "hkbatish592002@gmail.com";

export async function getPersistentTier(supabase: any, userId: string): Promise<UserTier> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  if (error || !data) return "free";
  return data.tier as UserTier;
}

export function getUserTier(user: any): UserTier {
  if (!user) return "free";
  
  // Special test user override
  if (user.email === TEST_EMAIL) {
    return "elite";
  }

  // Fallback for immediate UI usage before profile is fetched
  return (user.user_metadata?.tier as UserTier) || "free"; 
}

export function canAccessMode(tier: UserTier, mode: StudyMode): boolean {
  return (TIER_PERMISSIONS[tier].modes as readonly StudyMode[]).includes(mode);
}

export function canAccessTool(tier: UserTier, tool: keyof typeof TIER_PERMISSIONS['elite']): boolean {
  const perms = TIER_PERMISSIONS[tier];
  if (typeof perms[tool] === 'boolean') {
    return perms[tool] as boolean;
  }
  return false;
}
