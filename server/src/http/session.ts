import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { sendMail, signupCodeMail } from "../mail.js";
import { z } from "zod";
import { prisma } from "../data/db.js";
import { asyncRoute, HttpError } from "./errors.js";
import { requireReader, revokeCurrentToken, signReader } from "./guard.js";

export const sessionRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1, "A name is required.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(120),
  password: z.string().min(8, "Use at least 8 characters.").max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter a password."),
});

function publicReader(reader: { id: string; email: string; name: string; role: string }) {
  return {
    id: reader.id,
    email: reader.email,
    name: reader.name,
    role: reader.role === "desk" ? "desk" : "reader",
  } as const;
}

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const verifySchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
});

const resendSchema = z.object({ email: z.string().trim().email("Enter a valid email.") });

function hashCode(email: string, code: string): string {
  const pepper = process.env.JWT_SECRET || "reading-room";
  return createHash("sha256").update(`${email}:${code}:${pepper}`).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Step 1: remember the registration and email a 6-digit code.
// No account exists until the code is confirmed in step 2.
sessionRouter.post(
  "/register",
  asyncRoute(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await prisma.reader.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with that email already exists.");

    const pending = await prisma.signupCode.findUnique({ where: { email } });
    if (pending && Date.now() - pending.sentAt.getTime() < RESEND_AFTER_MS) {
      throw new HttpError(429, "A code was just sent to that email. Wait a minute before asking again.");
    }

    const code = newCode();
    const data = {
      name: body.name,
      passwordHash: await bcrypt.hash(body.password, 10),
      codeHash: hashCode(email, code),
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      sentAt: new Date(),
    };
    await prisma.signupCode.upsert({ where: { email }, create: { email, ...data }, update: data });

    try {
      await sendMail(signupCodeMail(email, body.name, code));
    } catch (error) {
      console.error("Could not send the signup code.", error);
      await prisma.signupCode.delete({ where: { email } }).catch(() => undefined);
      throw new HttpError(502, "The verification email could not be sent. Try again in a moment.");
    }

    res.status(202).json({ pending: true, email });
  }),
);

// Step 2: check the code, then create the account and sign the reader in.
sessionRouter.post(
  "/register/verify",
  asyncRoute(async (req, res) => {
    const body = verifySchema.parse(req.body);
    const email = body.email.toLowerCase();
    const pending = await prisma.signupCode.findUnique({ where: { email } });
    if (!pending || pending.expiresAt.getTime() < Date.now()) {
      throw new HttpError(400, "That code has expired. Register again to get a new one.");
    }
    if (pending.attempts >= MAX_ATTEMPTS) {
      throw new HttpError(429, "Too many wrong codes. Ask for a new code.");
    }
    if (!sameHash(pending.codeHash, hashCode(email, body.code))) {
      await prisma.signupCode.update({ where: { email }, data: { attempts: { increment: 1 } } });
      throw new HttpError(400, "That code is not right. Check the email and try again.");
    }

    const existing = await prisma.reader.findUnique({ where: { email } });
    if (existing) {
      await prisma.signupCode.delete({ where: { email } }).catch(() => undefined);
      throw new HttpError(409, "An account with that email already exists.");
    }
    const reader = await prisma.reader.create({
      data: { email, name: pending.name, passwordHash: pending.passwordHash, role: "reader" },
    });
    await prisma.signupCode.delete({ where: { email } }).catch(() => undefined);
    const profile = publicReader(reader);
    res.status(201).json({ token: signReader(profile), reader: profile });
  }),
);

// Send a fresh code for a registration that is still waiting.
sessionRouter.post(
  "/register/resend",
  asyncRoute(async (req, res) => {
    const email = resendSchema.parse(req.body).email.toLowerCase();
    const pending = await prisma.signupCode.findUnique({ where: { email } });
    if (!pending) throw new HttpError(404, "Nothing is waiting for that email. Register again.");
    if (Date.now() - pending.sentAt.getTime() < RESEND_AFTER_MS) {
      throw new HttpError(429, "A code was just sent. Wait a minute before asking again.");
    }
    const code = newCode();
    await prisma.signupCode.update({
      where: { email },
      data: { codeHash: hashCode(email, code), attempts: 0, expiresAt: new Date(Date.now() + CODE_TTL_MS), sentAt: new Date() },
    });
    try {
      await sendMail(signupCodeMail(email, pending.name, code));
    } catch (error) {
      console.error("Could not resend the signup code.", error);
      throw new HttpError(502, "The verification email could not be sent. Try again in a moment.");
    }
    res.json({ pending: true, email });
  }),
);

sessionRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const reader = await prisma.reader.findUnique({ where: { email: body.email.toLowerCase() } });
    const matches = reader ? await bcrypt.compare(body.password, reader.passwordHash) : false;
    if (!reader || !matches) {
      throw new HttpError(401, "Those credentials were not recognized.");
    }
    const profile = publicReader(reader);
    res.json({ token: signReader(profile), reader: profile });
  }),
);

sessionRouter.post(
  "/logout",
  requireReader,
  asyncRoute(async (req, res) => {
    revokeCurrentToken(req);
    res.json({ ok: true });
  }),
);

sessionRouter.get(
  "/me",
  requireReader,
  asyncRoute(async (req, res) => {
    const reader = await prisma.reader.findUnique({ where: { id: req.reader!.id } });
    if (!reader) throw new HttpError(401, "Sign in to continue.");
    res.json({ reader: publicReader(reader) });
  }),
);
