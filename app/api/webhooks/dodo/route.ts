import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const signature = req.headers.get("x-dodo-signature"); // Placeholder for real header

    // In production, verify the signature here using process.env.DODO_WEBHOOK_SECRET
    
    const { event_type, data } = payload;

    switch (event_type) {
      case "subscription.active":
      case "subscription.renewed": {
        const userId = data.metadata?.userId;
        const tier = data.metadata?.tier;
        const customerId = data.customer_id;
        const subscriptionId = data.id;

        if (userId && tier) {
          await supabaseAdmin
            .from("profiles")
            .update({
              tier,
              dodo_customer_id: customerId,
              dodo_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const userId = data.metadata?.userId;
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Dodo webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
