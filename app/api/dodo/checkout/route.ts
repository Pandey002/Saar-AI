import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDodoCheckout, DODO_PLAN_IDS } from "@/lib/dodo";
import { UserTier } from "@/types";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();
    const planId = DODO_PLAN_IDS[tier as keyof typeof DODO_PLAN_IDS];

    if (!planId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Fetch profile to get Dodo Customer ID if it exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("dodo_customer_id")
      .eq("id", user.id)
      .single();

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await createDodoCheckout({
      planId,
      customerId: profile?.dodo_customer_id,
      email: user.email!,
      returnUrl: `${origin}/dashboard?checkout=success`,
      metadata: {
        userId: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error("DEBUG: Dodo checkout api-route error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ 
      error: `Checkout Error: ${error.message}` 
    }, { status: 500 });
  }
}
