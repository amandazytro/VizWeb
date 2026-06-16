"use client";

import { useState } from "react";

export default function LoginPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      if (res.ok) {
        // full reload so the middleware re-evaluates with the new cookie
        window.location.href = "/";
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05101c] text-white">
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
          disabled={busy}
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
          className="mt-5 w-full rounded-full border border-white/70 bg-transparent py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
