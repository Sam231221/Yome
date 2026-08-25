import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { generateToken04 } from "../lib/zego-token.js";
import bcryptjs from "bcryptjs";
import crypto from "node:crypto";

function getAuthenticatedUserId(req: Request): number | null {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

function stripPassword<T extends { password: string }>(user: T): Omit<T, "password"> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function getUserByEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ ok: false, error: "Email is required" });
      return;
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
    } else {
      res.status(200).json({ ok: true, user: stripPassword(user) });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Verify email + password. Returns user without password hash on success, 401 otherwise.
 * Used by NextAuth credentials provider so the password never leaves the auth service.
 */
export async function verifyCredentials(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ ok: false, error: "email and password required" });
      return;
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });
    if (!user) {
      res.status(401).json({ ok: false, error: "Invalid credentials" });
      return;
    }
    const match = await bcryptjs.compare(password, user.password);
    if (!match) {
      res.status(401).json({ ok: false, error: "Invalid credentials" });
      return;
    }
    const { password: _p, ...userWithoutPassword } = user;
    res.status(200).json({ ok: true, user: userWithoutPassword });
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
      res.status(400).json({
        ok: false,
        error: "Email, Name and Password are required",
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
      res.status(409).json({ ok: false, error: "User already exists" });
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
    res.status(201).json({
      ok: true,
      user: stripPassword(user),
    });
  } catch (error) {
    next(error);
  }
}

function splitDisplayName(name?: string): { firstname: string; lastname: string } {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstname = parts[0] ?? "Yome";
  const lastname = parts.length > 1 ? parts.slice(1).join(" ") : "User";
  return { firstname, lastname };
}

function usernameBaseFromEmail(email: string): string {
  const [localPart] = email.split("@");
  const normalized = (localPart || "user").replace(/[^a-zA-Z0-9]/g, "");
  return normalized.slice(0, 18) || "user";
}

export async function upsertOAuthUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name, image } = req.body as {
      email?: string;
      name?: string;
      image?: string;
    };

    if (!email) {
      res.status(400).json({ ok: false, error: "Email is required" });
      return;
    }

    const prisma = getPrismaInstance();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });

    if (existingUser) {
      res.status(200).json({ ok: true, user: stripPassword(existingUser) });
      return;
    }

    const { firstname, lastname } = splitDisplayName(name);
    const usernameBase = usernameBaseFromEmail(email);
    let username = usernameBase;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${usernameBase}${suffix}`;
      suffix += 1;
    }

    const userProfile = await prisma.userProfile.create({
      data: {
        bio: `Bio for ${firstname}`,
        address: `Address for ${firstname}`,
      },
    });
    const password = await bcryptjs.hash(crypto.randomUUID(), 10);
    const user = await prisma.user.create({
      data: {
        email,
        firstname,
        lastname,
        name: `${firstname} ${lastname}`,
        username,
        password,
        profilePicture: image ?? "",
        userProfileId: userProfile.id,
      },
      include: { userProfile: true },
    });

    res.status(201).json({ ok: true, user: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ ok: false, error: "All password fields are required" });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ ok: false, error: "Passwords do not match" });
      return;
    }

    const passwordPattern =
      /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/;
    if (!passwordPattern.test(newPassword)) {
      res.status(400).json({
        ok: false,
        error:
          "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character",
      });
      return;
    }

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });

    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    const matches = await bcryptjs.compare(currentPassword, user.password);
    if (!matches) {
      res.status(400).json({ ok: false, error: "Current password is incorrect" });
      return;
    }

    const sameAsCurrent = await bcryptjs.compare(newPassword, user.password);
    if (sameAsCurrent) {
      res.status(400).json({
        ok: false,
        error: "New password must be different from the current password",
      });
      return;
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: authenticatedUserId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ ok: true, msg: "Password updated successfully" });
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
