"use client";
import {useRouter} from "next/navigation";
import { useState } from "react";
export function TestLogin() {
 const router=useRouter();
  const [error, setError] = useState("");
  return (
    <section className="panel">
      <h2>Try your testing family.</h2>
      <p>
        No payment or email account needed. This testing sign-in is available
        only on your local development server.
      </p>
      <button
        className="action"
        style={{ marginTop: 20 }}
        onClick={async () => {
          const r = await fetch("/api/family/test-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          if (r.ok) router.push("/dashboard");
          else setError("Testing sign-in is unavailable.");
        }}
      >
        Open testing family
      </button>
      <p role="status">{error}</p>
    </section>
  );
}
