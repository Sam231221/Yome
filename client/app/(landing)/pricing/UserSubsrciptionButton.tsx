"use client";
import React from "react";
import toast from "react-hot-toast";

import Loader from "@/components/common/Loader";
import axios from "axios";

interface ManageUserSubscriptionButtonProps {
  name: string;
  userId: string;
  email: string;
  classes: string;
  isCurrentPlan: boolean;
  isSubscribed: boolean;
  stripeCustomerId?: string | null;
  stripePriceId: string;
}

export function ManageUserSubscriptionButton({
  userId,
  email,
  isCurrentPlan,
  isSubscribed,
  stripeCustomerId,
  stripePriceId,
  classes,
}: ManageUserSubscriptionButtonProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const { data } = await axios.post(
          `http://localhost:3005/api/auth/manage-stripe-subscription-action`,
          {
            email,
            userId,
            isSubscribed,
            isCurrentPlan,
            stripeCustomerId,
            stripePriceId,
          }
        );
        console.log("data:", data);
        if (data) {
          window.location.href = data.url ?? "/dashboard/billing";
        }
      } catch (err) {
        console.error((err as Error).message);
        toast.error("Something went wrong, please try again later.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button className={classes} disabled={isPending}>
        {isPending && <Loader />}
        {isCurrentPlan ? "Manage Subscription" : "Subscribe"}
      </button>
    </form>
  );
}
