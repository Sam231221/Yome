import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { generateToken04 } from "../lib/zego-token.js";
import bcryptjs from "bcryptjs";

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
