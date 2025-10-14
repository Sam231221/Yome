import { SubscriptionPlans } from "../config/subscriptions.js";
import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";
import bcryptjs from "bcryptjs";
import { stripe } from "../lib/stripe.js";
import { absoluteUrl } from "../lib/utils.js";
import { v2 as cloudinary } from "cloudinary";

/**-----------------------
USER
 --------------------------*/
export const getUserByEmail = async (request, response, next) => {
  try {
    const { email } = request.body;
    if (!email) {
      return response.json({ msg: "Email is required", status: false });
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userProfile: true,
      },
    });
    if (!user) {
      return response.json({ msg: "User not found", status: false });
    } else
      return response.json({ msg: "User Found", status: true, user: user });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (request, response, next) => {
  try {
    const { userId } = request.body;
    if (!userId) {
      return response.json({ msg: "Id is required", status: false });
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
        userProfile: {
          select: {
            bio: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      return response.json({ msg: "User not found", status: false });
    } else
      return response.json({ msg: "User Found", status: true, user: user });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (request, response, next) => {
  try {
    const prisma = getPrismaInstance();
    const { email, username, lastname, firstname, password } = request.body;
    if (!email || !username || !password) {
      return response.json({
        msg: "Email, Name and Password are required",
        status: 400,
      });
    }
    const existingUserbyEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    const existingUserbyName = await prisma.user.findUnique({
      where: { username: username },
    });
    if (existingUserbyName || existingUserbyEmail) {
      return response.json({ msg: "User already exists", status: 409 });
    } else {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      // Create UserProfile first
      const userProfile = await prisma.userProfile.create({
        data: {
          bio: "Bio for " + firstname,
          address: "Address for " + firstname,
        },
      });

      // Create User and link to UserProfile
      const user = await prisma.user.create({
        data: {
          email,
          firstname,
          lastname,
          name: firstname + " " + lastname,
          username: username,
          password: hashedPassword,
          userProfileId: userProfile.id,
        },
      });

      return response.json({
        msg: "User Created Successfully",
        status: 200,
        data: user,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (request, response) => {
  try {
    const prisma = getPrismaInstance();
    const { userId } = request.query;
    const { email, bio, lastname, firstname, address } = request.body;
    let image = null; // Initialize image variable

    // Check if request.file is provided and contains file data
    if (request.file && request.file.buffer) {
      // Upload image if provided
      image = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "Eduroclass/Uploads/Profiles/" },
            (error, result) => {
              if (error) {
                reject("Failed to upload profile picture");
              } else {
                resolve(result);
              }
            }
          )
          .end(request.file.buffer);
      });
    }

    const existingUserbyId = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        userProfile: true,
      },
    });

    if (existingUserbyId.email !== email) {
      // Check if the provided email is already taken by other users
      const existingUserWithThatEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: parseInt(userId) },
        },
      });
      if (existingUserWithThatEmail) {
        return response.json({
          msg: "Sorry!, This email is already taken.",
          status: 400,
        });
      }
    }

    const userUpdateData = {
      username: firstname + " " + lastname,
      firstname: firstname,
      lastname: lastname,
      email: email,
    };

    // If image is provided, include it in the update data
    if (image) {
      userUpdateData.profilePicture = image.secure_url;
    }

    const user = await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: userUpdateData,
    });

    const userProfile = await prisma.userProfile.update({
      where: { id: existingUserbyId.userProfile.id },

      data: {
        bio: bio,
        address: address,
      },
    });

    return response.status(200).send({
      status: 200,
      user: { ...user, userProfile },
      msg: "updated successfully",
    });
  } catch (error) {
    //dont use next(error)
    console.log(error);
    return response.send({
      status: 500,
      msg: "Internal Server Error",
    });
  }
};

export const getAllUsers = async (req, res, next) => {
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
      include: {
        userProfile: true,
      },
    });

    return res.status(200).send({ users: users });
  } catch (error) {
    next(error);
  }
};

/**-----------------------
 Subscription
 --------------------------*/

export const getUserSubscriptionPlan = async (request, response, next) => {
  try {
    const { userId } = request.body;
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const isSubscribed =
      user.stripePriceId &&
      user.stripeCurrentPeriodEnd &&
      user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now();

    const plan = isSubscribed
      ? SubscriptionPlans.find(
          (plan) => plan.stripePriceId === user.stripePriceId
        )
      : null;

    let isCanceled = false;
    if (isSubscribed && user.stripeSubscriptionId) {
      const stripePlan = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId
      );
      isCanceled = stripePlan.cancel_at_period_end;
    }

    return response.status(200).send({
      ...plan,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
      isSubscribed,
      isCanceled,
    });
  } catch (e) {
    console.log(e);
    return response.status(500).send({
      status: 500,
      msg: "Internal server error",
    });
  }
};

export const updateUserSubscriptionPlanById = async (
  request,
  response,
  next
) => {
  try {
    const {
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripePriceId,
      stripeCurrentPeriodEnd,
    } = request.body;

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        stripeSubscriptionId: stripeSubscriptionId,
        stripeCustomerId: stripeCustomerId,
        stripePriceId: stripePriceId,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd,
      },
    });

    return response
      .status(200)
      .send({ status: "200", msg: "SUbscribed the plan" });
  } catch (e) {
    console.log(e);
  }
};

export const updateUserSubscriptionPlanBySubscriptionId = async (
  request,
  response,
  next
) => {
  try {
    const { stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd } =
      request.body;
    console.log(stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd);
    const prisma = getPrismaInstance();

    await prisma.user.update({
      where: {
        stripeSubscriptionId: stripeSubscriptionId,
      },
      data: {
        stripePriceId: stripePriceId,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd,
      },
    });
    return response.status(200).send({
      status: "200",
      msg: "You have subscribe for the plan successfully.",
    });
  } catch (e) {
    console.log(e);
  }
};

export const manageStripeSubscriptionAction = async (
  request,
  response,
  next
) => {
  const billingUrl = absoluteUrl("/account");
  const {
    isSubscribed,
    stripeCustomerId,
    isCurrentPlan,
    stripePriceId,
    email,
    userId,
  } = request.body;

  console.log(
    isSubscribed,
    stripeCustomerId,
    isCurrentPlan,
    stripePriceId,
    email,
    userId
  );
  if (isSubscribed && stripeCustomerId && isCurrentPlan) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: billingUrl,
    });

    return response.status(200).send({ url: stripeSession.url });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: billingUrl,
    cancel_url: billingUrl,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    customer_email: email,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      email: email,
      userId: parseInt(userId),
    },
  });

  return response.status(200).send({ url: stripeSession.url });
};

/**-----------------------
Connections
 --------------------------*/
export const getGroupById = async (request, response, next) => {
  try {
    const { groupId } = request.body;
    if (!groupId) {
      return response.json({ msg: "Email is required", status: false });
    }
    const prisma = getPrismaInstance();
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      return response.json({ msg: "Group not found", status: false });
    } else
      return response.json({ msg: "Group Found", status: true, group: group });
  } catch (error) {
    console.log(error);
  }
};

export const getFollowedUsersByUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(req.params.loggedInUserId);

    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: {
        following: {
          include: { userProfile: true },
        },
      },
    });

    // Extract the users followed by the logged-in user
    const followedUsers = user.following;
    return res.status(200).send({ followedUsers: followedUsers });
  } catch (error) {
    next(error);
  }
};

export const getUnfollowedMentors = async (req, res, next) => {
  const loggedInUserId = parseInt(req.params.loggedInUserId);

  try {
    const prisma = getPrismaInstance();
    const mentorsNotFollowed = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        NOT: {
          followers: { some: { id: loggedInUserId } },
        },
        id: { not: loggedInUserId },
      },
    });

    return res.status(200).json({ mentorsNotFollowed });
  } catch (error) {
    next(error);
  }
};

export const getUnassociatedGroupsForUser = async (req, res, next) => {
  const loggedInUserId = parseInt(req.params.loggedInUserId);

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

    return res.status(200).json({ unassociatedGroups });
  } catch (error) {
    next(error);
  }
};

export const getAllGroupsForUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(req.params.loggedInUserId);

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });
    return res.status(200).send({ groups: groups });
  } catch (error) {
    next(err);
  }
};

export const getAllGroups = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });

    return res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
};

export const followUnfollowedUser = async (req, res, next) => {
  const { loggedInUserId, mentorId } = req.body;

  try {
    const prisma = getPrismaInstance();
    // Check if the user to follow exists and is not the logged-in user
    const userToFollow = await prisma.user.findUnique({
      where: { id: parseInt(mentorId) },
    });

    if (!userToFollow || userToFollow.id === loggedInUserId) {
      return res.status(400).send("Invalid user to follow.");
    }

    // Check if the logged-in user is already following the user
    const isFollowing = await prisma.user.count({
      where: {
        id: loggedInUserId,
        following: { some: { id: parseInt(mentorId) } },
      },
    });

    if (isFollowing > 0) {
      return res.status(400).send("You are already following this user.");
    }

    // Connect the logged-in user to the user they want to follow
    await prisma.user.update({
      where: { id: loggedInUserId },
      data: { following: { connect: { id: parseInt(mentorId) } } },
    });

    res
      .status(200)
      .send({ status: 200, msg: "Successfully followed the user." });
  } catch (error) {
    next(error);
  }
};

export const joinUnjoinedGroups = async (req, res, next) => {
  const { loggedInUserId, groupIdToJoin } = req.body; // Assuming groupIdToJoin is passed as a parameter

  try {
    const prisma = getPrismaInstance();
    // Check if the group to join exists
    const groupToJoin = await prisma.group.findUnique({
      where: { id: groupIdToJoin },
    });

    if (!groupToJoin) {
      return res.status(400).send("Invalid group to join.");
    }

    // Check if the logged-in user is already a member or admin of the group
    const isMemberOrAdmin = await prisma.group.count({
      where: {
        id: groupIdToJoin,
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });

    if (isMemberOrAdmin > 0) {
      return res
        .status(400)
        .send("You are already a member or admin of this group.");
    }

    // Connect the logged-in user to the group they want to join as a member
    await prisma.group.update({
      where: { id: groupIdToJoin },
      data: { members: { connect: { id: loggedInUserId } } },
    });

    res
      .status(200)
      .send({ status: 200, msg: "Successfully joined the group." });
  } catch (error) {
    next(error);
    res.status(500).send("Error joining the group.");
  }
};

/**-----------------------
Utils
 --------------------------*/

export const generateToken = (req, res, next) => {
  try {
    const appID = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_APP_SECRET;
    const userId = req.params.userId;
    const effectiveTimeInSeconds = 3600;
    const payload = "";
    console.log(appID, serverSecret, userId);
    if (appID && serverSecret && userId) {
      const token = generateToken04(
        appID,
        userId,
        serverSecret,
        effectiveTimeInSeconds,
        payload
      );
      res.status(200).json({ token });
    }
    return res
      .status(400)
      .send("User id, app id and server secret is required");
  } catch (err) {
    next(err);
  }
};
