"use client";

import { useEffect, useState } from "react";

// ── SOFT password gate (client-side) ──────────────────────────────────────────
// Shown on every new tab/session until the correct password is entered.
// NOTE: this is a light lock — the password ships in the client bundle, so it
// only deters casual access (good for a private preview). For real protection
// we'd move it server-side (Next middleware + env var + cookie).
const PASSWORD = "ZyTr0_202601";
const KEY = "zy-unlocked";

export default function PasswordGate() {
  const [locked, setLocked] = useState(true);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(KEY) === "1") {
      setLocked(false);
    }
  }, []);

  if (!locked) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(KEY, "1");
      setLocked(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05101c] text-white">
      {/* blurred building backdrop for ambience */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/frames/explore/0048.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-xl" />
      <div className="absolute inset-0 bg-[#05101c]/55" />

      <form onSubmit={submit} className="relative z-10 flex w-[min(360px,86vw)] flex-col items-center text-center">
        <span style={{ fontFamily: "var(--font-recia), Georgia, serif" }} className="text-3xl font-bold tracking-[0.02em] drop-shadow">
          THE VERTICAL
        </span>
        <p style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }} className="mt-2 text-[13px] text-white/55">
          Digite a senha para acessar a experiência
        </p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Senha"
          aria-label="Senha"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
          className={[
            "mt-7 w-full rounded-full border bg-white/[0.06] px-5 py-3 text-center text-sm tracking-wide text-white outline-none backdrop-blur-md transition placeholder:text-white/35",
            error ? "border-red-400/70" : "border-white/15 focus:border-accent",
          ].join(" ")}
        />
        {error && (
          <p style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }} className="mt-2 text-[12px] text-red-300">
            Senha incorreta
          </p>
        )}

        <button
          type="submit"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
          className="mt-5 w-full rounded-full border border-white/70 bg-transparent py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
