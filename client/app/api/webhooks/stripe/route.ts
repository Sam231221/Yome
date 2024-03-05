import { stripe } from "@/lib/stripe";
import {
  GET_USER_BY_ID_ROUTE,
  UPDATE_USER_SUBSCRIPTION_PLAN_BY_ID,
  UPDATE_USER_SUBSCRIPTION_PLAN_BY_SUBSCRIPTIONID,
} from "@/utils/ApiRoutes";
import axios, { AxiosResponse } from "axios";
import toast from "react-hot-toast";
import type Stripe from "stripe";
import nodemailer from "nodemailer";
interface EventData {
  userId?: string;
}
interface UserProfile {
  id: string;
  bio: string;
  address: string;
  created_at: string; // You might want to use a specific date type here
  updated_at: string; // You might want to use a specific date type here
}

interface UserData {
  first_name?: string;
  last_name?: string;
  username: string;
  profile_pic?: string;
  email?: string;
  is_email_verified?: boolean;
  is_activated?: boolean;
  password?: string;
  address?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodEnd?: Date;
}

interface UserApiResponse {
  msg: string;
  status: boolean;
  user?: User;
}

interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  name?: string | null;
  username: string;
  role: string;
  userProfile: UserProfile;
  profilePicture: string;
  password: string;
  eiId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}
import { headers } from "next/headers";

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

  // Function to send the email
  async function sendUserWelcomeEmail(
    email: string | undefined,
    username: string,
    firstname: string | undefined,
    password: string | undefined
  ) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        auth: {
          user: "acadeprasuccor2112@gmail.com",
          pass: "qpsy fgsc mdyp dpoe",
        },
      });

      const mailOptions = {
        from: "acadeprasuccor2112@gmail.com",
        to: email,
        subject: "Welcome to EduroCms!",
        text: `Hello ${firstname},\n\nWelcome to Your SMS! Here are your login details:\n\nusername: ${username}\nPassword: ${password}\n\nPlease keep this information safe and secure.\n\nThanks,\nThe EduroTeam`,
      };

      await transporter.sendMail(mailOptions);
      toast.success("Email sent successfully!");
    } catch (error) {
      toast.error("Error sending email:");
      // Handle email sending errors appropriately
    }
  }
  const handleCheckoutSessionCompleted = async () => {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const userId = session?.metadata?.userId;

    try {
      const { data }: AxiosResponse<UserApiResponse> = await axios.post(
        GET_USER_BY_ID_ROUTE,
        { userId }
      );

      if (data.status) {
        const user = data.user;

        if (user) {
          const userData: UserData = {
            first_name: user.firstname,
            last_name: user.lastname,
            username: user.username,
            profile_pic: user.profilePicture,
            email: user.email,
            is_email_verified: true,
            is_activated: true,
            password: "Qa34ExyyiDedSSf",
            address: user.userProfile.address,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          };

          const [apiResponse] = await Promise.all([
            axios.post("http://127.0.0.1:8000/api/create-user/", userData),
            axios.post(UPDATE_USER_SUBSCRIPTION_PLAN_BY_ID, {
              userId: session?.metadata?.userId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            }),
          ]);
          // Send email to user
          await sendUserWelcomeEmail(
            userData.email,
            userData.username,
            userData.first_name,
            userData.password
          );
          console.log(apiResponse.data);
        } else {
          console.log("User not found");
        }
      }
    } catch (error) {
      console.log("eerror");
      console.error(error);
    }
  };

  const handleInvoicePaymentSucceeded = async () => {
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
  };
  if (event.type === "checkout.session.completed") {
    try {
      await handleCheckoutSessionCompleted();
    } catch (e) {
      console.log(e);
    }
  }
  if (event.type === "customer.subscription.updated") {
    console.log("event triggered");

    // Now you can access details such as billing address, name, etc. from `billingInfo`
  }

  //Successful Subscription Renewal or Trial Period End:
  if (event.type === "invoice.payment_succeeded") {
    console.log("Updating by SubscriptionId");

    await handleInvoicePaymentSucceeded();
  }

  return new Response(null, { status: 200 });
}
