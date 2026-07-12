import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="w-full border-b-2 border-ink px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold">
        單字小卡
      </Link>
      <div className="flex items-center gap-4 text-sm font-bold">
        {user ? (
          <>
            <Link href="/decks">我的卡組</Link>
            <SignOutButton />
          </>
        ) : (
          <Link href="/login">登入</Link>
        )}
      </div>
    </nav>
  );
}
