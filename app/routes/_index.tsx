import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="p-3">
      <h1 className="text-3xl">Discourse Auth Test</h1>
      <div className="flex flex-col">
        <Link className="py-3" to="/login">
          Login through Discourse (/login)
        </Link>
        <Link className="py-3" to="/login?sso=foo&sig=bar">
          Visiting this link will destroy the nonce session
          (/login?sso=foo&sig=bar)
        </Link>
      </div>
    </div>
  );
}
