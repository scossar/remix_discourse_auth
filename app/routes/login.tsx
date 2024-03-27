import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createHmac, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

import { nonceStorage, sessionStorage } from "~/services/session.server";

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
    const computedSig = createHmac("sha256", secret).update(sso).digest();
    const receivedSigBytes = Buffer.from(sig, "hex");
    if (computedSig.equals(receivedSigBytes)) {
      const decodedPayload = Buffer.from(sso, "base64").toString("utf-8");
      const params = new URLSearchParams(decodedPayload);
      const nonce = params.get("nonce");
      const sessionNonce = nonceSession.get("nonce");
      if (sessionNonce && sessionNonce === nonce) {
        const externalId = params.get("external_id");
        const username = params.get("username");
        const avatarUrl = params.get("avatar_url");
        const trustLevel = params.get("trust_level");
        const userSession = await sessionStorage.getSession();
        userSession.set("externalId", externalId);
        userSession.set("username", username);
        userSession.set("avatarUrl", avatarUrl);
        userSession.set("trustLevel", trustLevel);
        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          await nonceStorage.destroySession(nonceSession)
        );
        headers.append(
          "Set-Cookie",
          await sessionStorage.commitSession(userSession)
        );
        return redirect("/", { headers });
      }
    }
  }

  // if authentication fails, destroy the nonceSession so it can't be re-used
  return redirect("/", {
    headers: {
      "Set-Cookie": await nonceStorage.destroySession(nonceSession),
    },
  });
};
