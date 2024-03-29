import { Link } from "@remix-run/react";

interface HeaderProps {
  user?: {
    externalId?: number | null;
    avatarUrl?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const externalId = user?.externalId;
  const avatarUrl = user?.avatarUrl;
  const activeSession = externalId ? true : false;
  const logInOutLink = activeSession ? "/logout" : "/login";
  return (
    <header className="h-14 w-full bg-cyan-700 text-slate-50 py-3">
      <div className=" flex flex-row items-center justify-between max-w-screen-md mx-auto">
        <div>
          <h1 className="text-xl">Discourse Auth</h1>
        </div>
        <div className="flex flex-row w-fit">
          <Link
            className="bg-slate-50 text-slate-900 text-lg px-2 rounded-sm inline-block"
            to={logInOutLink}
          >
            {activeSession ? "Log Out" : "Log In"}
          </Link>
          {activeSession && avatarUrl ? (
            <img className="w-8 h-8 ml-3 rounded-full" src={avatarUrl} alt="" />
          ) : (
            <div></div>
          )}
          <div></div>
        </div>
      </div>
    </header>
  );
}
