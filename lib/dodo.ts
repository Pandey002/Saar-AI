export const DODO_PLAN_IDS = {
  student: process.env.DODO_PLAN_STUDENT || "pd_student_monthly",
  achiever: process.env.DODO_PLAN_ACHIEVER || "pd_achiever_monthly",
  elite: process.env.DODO_PLAN_ELITE || "pd_elite_monthly",
} as const;

export async function createDodoCheckout(params: {
  planId: string;
  customerId?: string;
  email: string;
  metadata?: Record<string, string>;
  returnUrl: string;
}) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured.");
  }

  let response;
  try {
    response = await fetch("https://api.dodopayments.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: params.planId,
        customer_email: params.email,
        customer_id: params.customerId || undefined,
        return_url: params.returnUrl,
        metadata: {
          ...params.metadata,
          source: "vidya_app",
        },
      }),
    });
  } catch (err: any) {
    console.error("DEBUG: Dodo checkout error details:", {
      message: err.message,
      stack: err.stack,
    });
    throw new Error(`Dodo API Connection Failed: ${err.message || "Is the backend connected to the internet?"}`);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create Dodo checkout session.");
  }

  return await response.json();
}

/**
 * Verifies the webhook signature from Dodo Payments.
 * Note: Actual implementation depends on their signing method (usually HMAC SHA256).
 */
export function verifyDodoSignature(payload: string, signature: string, secret: string): boolean {
  // Use crypto to verify the signature. 
  // For standard Node.js/Edge environments:
  // const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // return hmac === signature;
  
  // Implementation will vary based on runtime (Edge vs Node)
  return true; // Placeholder for now, to be implemented with real crypto logic
}
