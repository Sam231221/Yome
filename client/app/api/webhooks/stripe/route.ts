import { stripe } from "@/lib/stripe";
import {
  UPDATE_USER_SUBSCRIPTION_PLAN_BY_ID,
  UPDATE_USER_SUBSCRIPTION_PLAN_BY_SUBSCRIPTIONID,
} from "@/utils/ApiRoutes";
import axios from "axios";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 }
    );
  }
  const session = event.data.object as Stripe.Checkout.Session;
  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    });
  }

  if (event.type === "checkout.session.completed") {
    console.log("Updating by Id");
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await axios.post(UPDATE_USER_SUBSCRIPTION_PLAN_BY_ID, {
      userId: session.metadata.userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  }

  //Successful Subscription Renewal or Trial Period End:
  if (event.type === "invoice.payment_succeeded") {
    console.log("Updating by SubscriptionId");

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the price id and set the new period end.
    await axios.post(UPDATE_USER_SUBSCRIPTION_PLAN_BY_SUBSCRIPTIONID, {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  }

  return new Response(null, { status: 200 });
}
