"use client";
import React from "react";
import toast from "react-hot-toast";

import Loader from "@/components/common/Loader";
import axios from "axios";
import { MANAGE_STRIPE_SUBSCRIPTION_ACTION } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";

interface ManageUserSubscriptionButtonProps {
  name: string;
  userId: string;
  email: string;
  formValues: object;
  classes: string;
  isCurrentPlan: boolean;
  IsFormFilled: boolean;
  handleCreateInstitution: Function;
  isSubscribed: boolean;
  stripeCustomerId?: string | null;
  stripePriceId: string;
}

export function ManageUserSubscriptionButton({
  userId,
  email,
  isCurrentPlan,
  IsFormFilled,
  handleCreateInstitution,
  isSubscribed,
  stripeCustomerId,
  stripePriceId,
  classes,
}: ManageUserSubscriptionButtonProps) {
  console.log(
    userId,
    email,
    isCurrentPlan,
    isSubscribed,
    stripeCustomerId,
    stripePriceId,
    classes
  );
  const [{ userInfo }, dispatch] = useStateProvider();

  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = async () => {
    const { status, msg } = await handleCreateInstitution();
    console.log(status, msg);
    if (status === 200) {
      startTransition(async () => {
        try {
          const { data } = await axios.post(MANAGE_STRIPE_SUBSCRIPTION_ACTION, {
            email,
            userId,
            isSubscribed,
            isCurrentPlan,
            stripeCustomerId,
            stripePriceId,
          });

          if (data) {
            window.location.href = data.url ?? "/account";
          }
        } catch (err) {
          console.error((err as Error).message);
          toast.error("Something went wrong, please try again later.");
        }
      });
    } else {
      toast.error(msg);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSubmit}
      className={classes}
      disabled={!IsFormFilled || isPending ? true : false}
    >
      {isPending && <Loader />}
      {isCurrentPlan ? "Manage Subscription" : "Subscribe"}
    </button>
  );
}
