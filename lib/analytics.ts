import { sendGAEvent } from "@next/third-parties/google";

/**
 * Logs a custom event to Google Analytics.
 * @param eventName The name of the event (e.g., 'generate_mock_test')
 * @param params Additional metadata for the event
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    sendGAEvent("event", eventName, params);
    
    // Also log to Clarity if available
    if (typeof window !== "undefined" && (window as any).clarity) {
      (window as any).clarity("event", eventName);
    }
  } catch (error) {
    console.error("Analytics error:", error);
  }
}
