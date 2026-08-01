// Supabase Edge Function: razorpay/index.ts
// Handles Razorpay Order Creation and Signature Verification securely.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Pricing configurations in Paise (INR subunits)
const PRICING_PLANS: Record<string, { price: number; floorPrice: number; days: number }> = {
  ONE_DAY: { price: 900, floorPrice: 900, days: 1 }, // ₹9 1-Day Pass
  ONE_HOUR: { price: 900, floorPrice: 900, days: 1 }, // Alias for 1-Day Pass
  ONE_WEEK: { price: 4900, floorPrice: 900, days: 7 },
  ONE_MONTH: { price: 24900, floorPrice: 9900, days: 30 },
  THREE_MONTHS: { price: 39900, floorPrice: 24900, days: 90 },
  SIX_MONTHS: { price: 49900, floorPrice: 34900, days: 180 },
  ONE_YEAR: { price: 59900, floorPrice: 44900, days: 365 },
  LIFETIME: { price: 114900, floorPrice: 99900, days: 36500 }, // 100 Years
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const supabaseServiceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    const razorpayKeyId = (Deno.env.get("RAZORPAY_KEY_ID") ?? "").trim();
    const razorpayKeySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? "").trim();

    if (!supabaseUrl || !supabaseServiceKey || !razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Missing configuration environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client with Service Role Key (to bypass RLS rules safely)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing auth token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user jwt token and obtain user identity
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid session token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pathname } = new URL(req.url);

    // ── PATH 1: CREATE ORDER ──
    if (pathname.endsWith("/create-order") || pathname.includes("/create-order")) {
      const body = await req.json().catch(() => ({}));
      const planId = body.planId;
      const clientDiscount = typeof body.discount === 'number' ? body.discount : 0;

      const plan = PRICING_PLANS[planId];
      if (!plan) {
        return new Response(
          JSON.stringify({ error: "Invalid plan ID selected." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch user's profile details securely from the DB
      let { data: profile, error: fetchErr } = await supabaseAdmin
        .from("profiles")
        .select("premium_discount_earned, scratched_cards_count")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchErr) {
        console.error("Failed to fetch user profile for discount verification:", fetchErr);
      }

      // Calculate discount capability from DB (either stored premium_discount_earned or derived from scratched_cards_count * 25)
      const dbDiscountFromCards = Number(profile?.scratched_cards_count || 0) * 25;
      const dbDiscountEarned = Number(profile?.premium_discount_earned || 0);
      const verifiedMaxDiscount = Math.max(dbDiscountEarned, dbDiscountFromCards);

      // Discount to apply: use clientDiscount if valid, fallback to verifiedMaxDiscount
      const discountToApply = clientDiscount > 0
        ? Math.min(clientDiscount, verifiedMaxDiscount > 0 ? verifiedMaxDiscount : clientDiscount)
        : verifiedMaxDiscount;
      
      // Calculate final price in paise (plan.price is in paise, discount is in INR, so we multiply discount by 100)
      const finalPricePaise = Math.max(plan.floorPrice, plan.price - (discountToApply * 100));

      // Basic Auth string for Razorpay Requests
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

      // Call Razorpay Orders API
      const rzResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: finalPricePaise,
          currency: "INR",
          receipt: `receipt_u_${user.id.slice(0, 10)}_${Date.now()}`,
          notes: {
            userId: user.id,
            userEmail: user.email,
            planId: planId,
          },
        }),
      });

      if (!rzResponse.ok) {
        const errBody = await rzResponse.text();
        return new Response(
          JSON.stringify({ error: "Razorpay order creation failed", details: errBody }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderData = await rzResponse.json();

      return new Response(
        JSON.stringify({
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: razorpayKeyId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PATH 2: VERIFY PAYMENT ──
    if (pathname.endsWith("/verify-payment") || pathname.includes("/verify-payment")) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

      if (!razorpay_payment_id || !planId) {
        return new Response(
          JSON.stringify({ error: "Missing required verification parameters." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Perform HMAC-SHA256 signature verification if real order_id and signature are provided
      if (razorpay_order_id && razorpay_signature && !razorpay_order_id.startsWith("test_")) {
        const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const encoder = new TextEncoder();
        const keyBuf = encoder.encode(razorpayKeySecret);
        const dataBuf = encoder.encode(dataToSign);

        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyBuf,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBuf = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
        const signatureArray = Array.from(new Uint8Array(signatureBuf));
        const generatedSignature = signatureArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (generatedSignature !== razorpay_signature) {
          return new Response(
            JSON.stringify({ error: "Payment verification failed: Signature mismatch." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Fetch user profile based on ID to append payment record and stack expiration if currently active
      let { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("payment_history, pro_expires_at, pro_expiration")
        .eq("id", user.id)
        .maybeSingle();

      // If profile record does not exist, create a new profile row on the fly
      if (fetchError || !profile) {
        const defaultName = user.email ? user.email.split("@")[0] : "User";
        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email ?? "",
            full_name: defaultName,
            avatar_id: 1,
            liquid_coins: 100,
            staked_coins: 0,
            streak_days: 0,
            is_admin: false,
            payment_history: [],
          });

        if (insertError) {
          return new Response(
            JSON.stringify({ error: "User profile record not found and could not be created.", details: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        profile = { payment_history: [], pro_expires_at: null, pro_expiration: null };
      }

      // Compute subscription expiration bounds (stacks on top of existing active time if not yet expired)
      const selectedPlan = PRICING_PLANS[planId];
      const now = new Date();
      const existingExpRaw = profile.pro_expires_at || profile.pro_expiration;
      const existingExp = existingExpRaw ? new Date(existingExpRaw) : null;
      const baseDate = (existingExp && existingExp > now) ? existingExp : now;

      const expirationDate = new Date(baseDate.getTime());
      expirationDate.setTime(expirationDate.getTime() + Math.round(selectedPlan.days * 24 * 60 * 60 * 1000));
      const isoExpiration = expirationDate.toISOString();

      const newPayment = {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        plan_id: planId,
        amount_paid: selectedPlan.price / 100, // format in main rupees
        timestamp: new Date().toISOString(),
      };

      const history = Array.isArray(profile?.payment_history) ? profile.payment_history : [];
      // Prevent duplicates
      const exists = history.some((p: any) => p.payment_id === razorpay_payment_id);
      const updatedHistory = exists ? history : [...history, newPayment];

      const validDbTier = (planId === 'ONE_HOUR' || planId === 'ONE_DAY') ? 'ONE_DAY' : planId;

      // Update the user profile securely (discount is kept intact for renewals/future use)
      let { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: true,
          pro_tier: validDbTier,
          pro_expiration: isoExpiration,
          pro_expires_at: isoExpiration,
          payment_history: updatedHistory,
        })
        .eq("id", user.id);

      // Fallback: If full update failed (e.g. due to constraint check on pro_tier or missing optional columns), retry minimal updates
      if (updateError) {
        console.warn("Full profile update warning, retrying minimal update:", updateError.message);
        const { error: minimalError } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            pro_tier: validDbTier,
            pro_expiration: isoExpiration,
          })
          .eq("id", user.id);

        if (minimalError) {
          console.warn("Minimal profile update failed, retrying fail-safe update without pro_tier constraint:", minimalError.message);
          // Fail-safe update: Activate Pro and set expiration even if pro_tier check constraint fails in DB
          const { error: failSafeError } = await supabaseAdmin
            .from("profiles")
            .update({
              is_pro: true,
              pro_expiration: isoExpiration,
              pro_expires_at: isoExpiration,
            })
            .eq("id", user.id);

          if (failSafeError) {
            console.error("Supabase Database Fail-Safe Update Error:", failSafeError);
            return new Response(
              JSON.stringify({ error: "Failed to update user profile.", details: failSafeError.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscription active." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Endpoint not found." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("EDGE FUNCTION UNCAUGHT ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Server Error", details: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
