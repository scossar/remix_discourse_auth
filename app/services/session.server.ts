import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.NONCE_SECRET) {
  throw new Error("Required cookie secret variable not set");
}
const nonceSecret: string = process.env.NONCE_SECRET;

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
