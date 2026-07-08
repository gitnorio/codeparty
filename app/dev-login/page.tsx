"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const testUsers = [
  {
    label: "Alex Frontend",
    email: "user1@test.com",
    password: "Password123!",
  },
  {
    label: "Sam Backend",
    email: "user2@test.com",
    password: "Password123!",
  },
  {
    label: "Chris Fullstack",
    email: "user3@test.com",
    password: "Password123!",
  },
  {
    label: "Mina Busy",
    email: "user4@test.com",
    password: "Password123!",
  },
  {
    label: "Leo Mobile",
    email: "user5@test.com",
    password: "Password123!",
  },
];

export default function DevLoginPage() {
  const router = useRouter();

  async function loginAs(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-3xl font-bold">Dev Login</h1>

      <div className="flex max-w-sm flex-col gap-3">
        {testUsers.map((user) => (
          <button
            key={user.email}
            onClick={() => loginAs(user.email, user.password)}
            className="rounded-md border px-4 py-2 text-left hover:bg-gray-100"
          >
            Login as {user.label}
          </button>
        ))}
      </div>
    </main>
  );
}