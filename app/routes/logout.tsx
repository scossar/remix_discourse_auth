import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { sessionStorage } from "~/services/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
};
