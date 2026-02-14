import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { SubscriptionPlans, absoluteUrl } from "@repo/shared";
import { generateToken04 } from "../lib/zego-token.js";
import stripe from "../lib/stripe.js";
import bcryptjs from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { groupData } from "../data/groups.js";

export async function getUserByEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.json({ msg: "Email is required", status: false });
      return;
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });
    if (!user) {
      res.json({ msg: "User not found", status: false });
    } else {
      res.json({ msg: "User Found", status: true, user });
    }
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.json({ msg: "Id is required", status: false });
      return;
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        name: true,
        username: true,
        role: true,
        profilePicture: true,
        password: true,
        eiId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        userProfile: { select: { bio: true, address: true } },
      },
    });
    if (!user) {
      res.json({ msg: "User not found", status: false });
    } else {
      res.json({ msg: "User Found", status: true, user });
    }
  } catch (error) {
    next(error);
  }
}

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const { email, username, lastname, firstname, password } = req.body as {
      email?: string;
      username?: string;
      lastname?: string;
      firstname?: string;
      password?: string;
    };
    if (!email || !username || !password) {
      res.json({
        msg: "Email, Name and Password are required",
        status: 400,
      });
      return;
    }
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });
    const existingByName = await prisma.user.findUnique({
      where: { username },
    });
    if (existingByName || existingByEmail) {
      res.json({ msg: "User already exists", status: 409 });
      return;
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const userProfile = await prisma.userProfile.create({
      data: {
        bio: "Bio for " + (firstname ?? ""),
        address: "Address for " + (firstname ?? ""),
      },
    });
    const user = await prisma.user.create({
      data: {
        email,
        firstname: firstname ?? "",
        lastname: lastname ?? "",
        name: (firstname ?? "") + " " + (lastname ?? ""),
        username,
        password: hashedPassword,
        userProfileId: userProfile.id,
      },
    });
    res.json({
      msg: "User Created Successfully",
      status: 200,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const userId = String(req.query.userId ?? "");
    const { email, bio, lastname, firstname, address } = req.body as Record<
      string,
      string
    >;
    let image: { secure_url: string } | null = null;

    if (req.file?.buffer) {
      image = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "Eduroclass/Uploads/Profiles/" },
            (error, result) => {
              if (error) reject(new Error("Failed to upload profile picture"));
              else resolve(result!);
            }
          )
          .end(req.file!.buffer);
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { userProfile: true },
    });
    if (!existingUser?.userProfile) {
      res.status(500).send({ status: 500, msg: "User not found" });
      return;
    }

    if (existingUser.email !== email) {
      const existingWithEmail = await prisma.user.findFirst({
        where: { email, NOT: { id: parseInt(userId) } },
      });
      if (existingWithEmail) {
        res.json({ msg: "Sorry!, This email is already taken.", status: 400 });
        return;
      }
    }

    const userUpdateData: Record<string, unknown> = {
      username: (firstname ?? "") + " " + (lastname ?? ""),
      firstname: firstname ?? "",
      lastname: lastname ?? "",
      email: email ?? "",
    };
    if (image) userUpdateData.profilePicture = image.secure_url;

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: userUpdateData as Parameters<typeof prisma.user.update>[0]["data"],
    });
    const userProfile = await prisma.userProfile.update({
      where: { id: existingUser.userProfile.id },
      data: { bio: bio ?? "", address: address ?? "" },
    });
    res.status(200).send({
      status: 200,
      user: { ...user, userProfile },
      msg: "updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.send({ status: 500, msg: "Internal Server Error" });
  }
}

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { firstname: "asc" },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        name: true,
        username: true,
        role: true,
        identifier: true,
        profilePicture: true,
      },
      include: { userProfile: true },
    });
    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
}

// Subscription
export async function getUserSubscriptionPlan(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.body as { userId?: string };
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId!) },
    });
    if (!user) {
      res.status(500).send({ status: 500, msg: "Internal server error" });
      return;
    }
    const isSubscribed =
      !!user.stripePriceId &&
      !!user.stripeCurrentPeriodEnd &&
      user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now();
    const plan = isSubscribed
      ? SubscriptionPlans.find((p) => p.priceId === user.stripePriceId) ?? null
      : null;
    res.status(200).send({
      ...plan,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
      isSubscribed,
      isCanceled: false,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ status: 500, msg: "Internal server error" });
  }
}

export async function updateUserSubscriptionPlanById(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const {
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripePriceId,
      stripeCurrentPeriodEnd,
    } = req.body as Record<string, unknown>;
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(String(userId)) },
    });
    if (!user) {
      res.status(400).send("User not found");
      return;
    }
    await prisma.user.update({
      where: { id: parseInt(String(userId)) },
      data: {
        stripeSubscriptionId: stripeSubscriptionId as string,
        stripeCustomerId: stripeCustomerId as string,
        stripePriceId: stripePriceId as string,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd as Date,
      },
    });
    res.status(200).send({ status: "200", msg: "SUbscribed the plan" });
  } catch (e) {
    console.error(e);
  }
}

export async function updateUserSubscriptionPlanBySubscriptionId(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd } =
      req.body as Record<string, unknown>;
    const prisma = getPrismaInstance();
    await prisma.user.update({
      where: { stripeSubscriptionId: stripeSubscriptionId as string },
      data: {
        stripePriceId: stripePriceId as string,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd as Date,
      },
    });
    res.status(200).send({
      status: "200",
      msg: "You have subscribe for the plan successfully.",
    });
  } catch (e) {
    console.error(e);
  }
}

export async function manageStripeSubscriptionAction(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const billingUrl = absoluteUrl("/account");
    const {
      isSubscribed,
      stripeCustomerId,
      isCurrentPlan,
      stripePriceId,
      email,
      userId,
    } = req.body as Record<string, unknown>;

    if (isSubscribed && stripeCustomerId && isCurrentPlan) {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId as string,
        return_url: billingUrl,
      });
      res.status(200).send({ url: session.url });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: email as string,
      line_items: [{ price: stripePriceId as string, quantity: 1 }],
      metadata: {
        email: String(email),
        userId: String(userId),
      },
    });
    res.status(200).send({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).send({ status: 500, msg: "Internal server error" });
  }
}

// Groups & connections
export async function getFollowedUsersByUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: {
        following: { include: { userProfile: true } },
      },
    });
    const followedUsers = user?.following ?? [];
    res.status(200).send({ followedUsers });
  } catch (error) {
    next(error);
  }
}

export async function getUnfollowedMentors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    const prisma = getPrismaInstance();
    const mentorsNotFollowed = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        NOT: { followers: { some: { id: loggedInUserId } } },
        id: { not: loggedInUserId },
      },
    });
    res.status(200).json({ mentorsNotFollowed });
  } catch (error) {
    next(error);
  }
}

export async function getUnassociatedGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
  if (Number.isNaN(loggedInUserId)) {
    res.status(400).json({ msg: "Invalid user id", unassociatedGroups: [] });
    return;
  }
  try {
    const prisma = getPrismaInstance();
    const unassociatedGroups = await prisma.group.findMany({
      where: {
        NOT: {
          OR: [
            { members: { some: { id: loggedInUserId } } },
            { admins: { some: { id: loggedInUserId } } },
          ],
        },
      },
    });

    if (unassociatedGroups.length === 0) {
      const totalGroups = await prisma.group.count();
      if (totalGroups === 0 && groupData.length > 0) {
        const allUsers = await prisma.user.findMany({
          select: { id: true },
          orderBy: { id: "asc" },
        });
        const oneBasedIndex =
          allUsers.findIndex((u: { id: number }) => u.id === loggedInUserId) + 1;
        const fromData = groupData
          .map((data, index) => ({ data, index }))
          .filter(
            ({ data }) =>
              ![
                ...(data.adminUserIDs ?? []),
                ...(data.memberUserIDs ?? []),
              ].includes(oneBasedIndex)
          )
          .map(({ data, index }) => ({
            id: `groupData-${index}`,
            name: data.name ?? "Untitled group",
            about: data.about ?? "Community group on Yome",
            thumbnail: data.thumbnail ?? "",
          }));
        res.status(200).json({ unassociatedGroups: fromData });
        return;
      }
    }
    res.status(200).json({ unassociatedGroups });
  } catch (error) {
    next(error);
  }
}

export async function getAllGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error); // fixed: was next(err)
  }
}

export async function getAllGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
}

export async function followUnfollowedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, mentorId } = req.body as {
    loggedInUserId?: number;
    mentorId?: string;
  };
  try {
    const prisma = getPrismaInstance();
    const userToFollow = await prisma.user.findUnique({
      where: { id: parseInt(mentorId!) },
    });
    if (!userToFollow || userToFollow.id === loggedInUserId) {
      res.status(400).send("Invalid user to follow.");
      return;
    }
    const isFollowing = await prisma.user.count({
      where: {
        id: loggedInUserId!,
        following: { some: { id: parseInt(mentorId!) } },
      },
    });
    if (isFollowing > 0) {
      res.status(400).send("You are already following this user.");
      return;
    }
    await prisma.user.update({
      where: { id: loggedInUserId! },
      data: { following: { connect: { id: parseInt(mentorId!) } } },
    });
    res.status(200).send({ status: 200, msg: "Successfully followed the user." });
  } catch (error) {
    next(error);
  }
}

export async function joinUnjoinedGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, groupIdToJoin } = req.body as {
    loggedInUserId?: number | string;
    groupIdToJoin?: string;
  };
  const userId =
    typeof loggedInUserId === "number"
      ? loggedInUserId
      : parseInt(String(loggedInUserId), 10);
  if (Number.isNaN(userId)) {
    res.status(400).json({ msg: "Invalid user id." });
    return;
  }
  try {
    const prisma = getPrismaInstance();
    let groupId: string = groupIdToJoin!;

    if (
      typeof groupIdToJoin === "string" &&
      groupIdToJoin.startsWith("groupData-")
    ) {
      const index = parseInt(groupIdToJoin.replace("groupData-", ""), 10);
      if (
        Number.isNaN(index) ||
        index < 0 ||
        index >= groupData.length
      ) {
        res.status(400).json({ msg: "Invalid group to join." });
        return;
      }
      const data = groupData[index]!;
      const allUsers = await prisma.user.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
      });
      const mapUserId = (oldId: number) => {
        const i = oldId - 1;
        return i < allUsers.length ? allUsers[i]!.id : null;
      };
      let group = await prisma.group.findFirst({
        where: { name: data.name },
      });
      if (!group) {
        const actualAdminIds = (data.adminUserIDs ?? [])
          .map(mapUserId)
          .filter((id): id is number => id !== null);
        const actualMemberIds = (data.memberUserIDs ?? [])
          .map(mapUserId)
          .filter((id): id is number => id !== null);
        group = await prisma.group.create({
          data: {
            name: data.name,
            about: data.about ?? "",
            thumbnail: data.thumbnail ?? "",
            admins:
              actualAdminIds.length > 0
                ? { connect: actualAdminIds.map((id) => ({ id })) }
                : undefined,
            members:
              actualMemberIds.length > 0
                ? { connect: actualMemberIds.map((id) => ({ id })) }
                : undefined,
          },
        });
      }
      groupId = group.id;
    }

    const groupToJoin = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!groupToJoin) {
      res.status(400).json({ msg: "Invalid group to join." });
      return;
    }
    const isMemberOrAdmin = await prisma.group.count({
      where: {
        id: groupId,
        OR: [
          { members: { some: { id: userId } } },
          { admins: { some: { id: userId } } },
        ],
      },
    });
    if (isMemberOrAdmin > 0) {
      res
        .status(400)
        .json({ msg: "You are already a member or admin of this group." });
      return;
    }
    await prisma.group.update({
      where: { id: groupId },
      data: { members: { connect: { id: userId } } },
    });
    res.status(200).json({ status: 200, msg: "Successfully joined the group." });
  } catch (error) {
    next(error);
  }
}

export function generateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const appID = parseInt(process.env.ZEGO_APP_ID ?? "", 10);
    const serverSecret = process.env.ZEGO_APP_SECRET;
    const userId = String(req.params.userId ?? "");
    const effectiveTimeInSeconds = 3600;
    const payload = "";
    if (appID && serverSecret && userId) {
      const token = generateToken04(
        appID,
        userId,
        serverSecret,
        effectiveTimeInSeconds,
        payload
      );
      res.status(200).json({ token });
      return;
    }
    res.status(400).send("User id, app id and server secret is required");
  } catch (err) {
    next(err);
  }
}
