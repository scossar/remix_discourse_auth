import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.NONCE_SECRET || !process.env.SESSION_SECRET) {
  throw new Error("Required cookie secret variable not set");
}
const nonceSecret: string = process.env.NONCE_SECRET;
const sessionSecret: string = process.env.SESSION_SECRET;

export const nonceStorage = createCookieSessionStorage({
  cookie: {
    name: "_nonce",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [nonceSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // the Discourse nonce is valid for 10 minutes, match that for now
  },
});

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 48, // set to two days for now
  },
});
