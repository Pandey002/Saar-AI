import { UserTier, StudyMode, LanguageMode } from "@/types";

export const TIER_PERMISSIONS = {
  free: {
    modes: ["summary"] as StudyMode[],
    tools: [] as string[],
    canDownloadPdf: false,
    canUseHinglish: false,
    canUseAdhyapak: false,
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
    canUseLearningPath: true,
    maxLifetimeGenerations: Infinity,
    maxDailyInputs: Infinity,
  },
} as const;

const TEST_EMAIL = "hkbatish592002@gmail.com";

export function getUserTier(user: any): UserTier {
  if (!user) return "free";
  
  // Special test user override
  if (user.email === TEST_EMAIL) {
    return "elite";
  }

  // Future persistence logic: return user.user_metadata?.tier || "free"
  // For now, if logged in, we grant "Achiever" to let them test (unless it's a guest)
  // Wait, the user said "a guest user should only be able to use the free tier services".
  // So logged in users should at least be 'student'.
  return (user.user_metadata?.tier as UserTier) || "achiever"; 
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
