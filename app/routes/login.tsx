import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createHmac, randomBytes } from "node:crypto";
// is this needed?
import { Buffer } from "node:buffer";

import { nonceStorage } from "~/services/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // if the secret isn't set, might as well redirect now
  if (!process.env.DISCOURSE_SSO_SECRET) {
    return redirect("/");
  }
  const secret = process.env.DISCOURSE_SSO_SECRET;
  const url = new URL(request.url);
  const sso = url.searchParams.get("sso");
  const sig = url.searchParams.get("sig");
  // the nonceSession will be set and committed if the auth flow is being initiated,
  // other wise it will be destroyed.
  const nonceSession = await nonceStorage.getSession(
    request.headers.get("Cookie")
  );

  if (!sso && !sig) {
    const nonce = randomBytes(16).toString("hex");
    const ssoPayload = `nonce=${nonce}&return_sso_url=http://localhost:5173/login`;
    const base64EncodedPayload = Buffer.from(ssoPayload).toString("base64");
    const urlEncodedPayload = encodeURIComponent(base64EncodedPayload);

    const signature = createHmac("sha256", secret)
      .update(base64EncodedPayload)
      .digest("hex");

    const discourseUrl = `http://localhost:4200/session/sso_provider?sso=${urlEncodedPayload}&sig=${signature}`;

    nonceSession.set("nonce", nonce);
    return redirect(discourseUrl, {
      headers: {
        "Set-Cookie": await nonceStorage.commitSession(nonceSession),
      },
    });
  }

  if (sso && sig) {
    const computedSig = createHmac("sha256", secret).update(sso).digest("hex");
    const computedSigBytes = Buffer.from(computedSig, "hex");
    const receivedSigBytes = Buffer.from(sig, "hex");
    if (computedSigBytes.equals(receivedSigBytes)) {
      console.log("the computed signature matches the received signature");
    }

    return redirect("/", {
      headers: {
        "Set-Cookie": await nonceStorage.destroySession(nonceSession),
      },
    });
  }

  // this should never get executed, but if it does, destroy the nonceSession
  return redirect("/", {
    headers: {
      "Set-Cookie": await nonceStorage.destroySession(nonceSession),
    },
  });
};
