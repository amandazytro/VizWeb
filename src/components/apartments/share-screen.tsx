"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useExperience, type Panel } from "@/lib/store";
import { STATUS_META, formatBRL, type Unit } from "@/lib/apartments";
import { plantaFor } from "@/lib/plantas";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-white/45">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ShareCircle({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/85 transition hover:bg-white/20"
    >
      {children}
    </button>
  );
}

export default function ShareScreen({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const openPanel = useExperience((s) => s.openPanel);
  const closePanel = useExperience((s) => s.closePanel);

  const nav = (p: Panel) => {
    onClose();
    if (p === "none") closePanel();
    else openPanel(p);
  };

  const SEL = [
    "/areas-comuns/detail/gameroom-01.webp",
    "/areas-comuns/detail/academia.webp",
    "/areas-comuns/detail/interior-142.webp",
  ];
  const card = "rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl";

  return (
    <div className="pointer-events-auto fixed inset-0 z-[70] overflow-hidden text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
      {/* blurred backdrop */}
      <Image src="/frames/explore/0156.webp" alt="" fill priority sizes="100vw" className="scale-110 object-cover blur-2xl" />
      <div className="absolute inset-0 bg-[#0a121c]/70" />

      {/* brand */}
      <span
        style={{ fontFamily: "var(--font-recia), Georgia, serif" }}
        className="absolute left-8 top-6 z-10 text-[17px] font-semibold tracking-[0.18em]"
      >
        THE VERTICAL
      </span>

      {/* back */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-8 top-6 z-10 flex flex-col items-center gap-1 text-white/85 transition hover:text-white"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14l-4-4 4-4" /><path d="M5 10h9a5 5 0 0 1 0 10h-1" />
          </svg>
        </span>
        <span className="text-[10px] tracking-[0.18em]">Voltar</span>
      </button>

      {/* content: 3 columns */}
      <div className="absolute inset-0 grid grid-cols-[1.15fr_1fr_0.82fr] items-stretch gap-4 px-8 pb-24 pt-20">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          {/* Overview (shorter) */}
          <div className={`${card} flex h-[55%] gap-5 p-6`}>
            <div className="relative w-1/2 shrink-0 overflow-hidden rounded-2xl">
              <Image src="/frames/explore/0156.webp" alt="Torre" fill sizes="20vw" className="object-cover" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-accent px-2 py-1 text-xs font-semibold shadow-lg">
                {unit.label}
              </span>
            </div>
            <div className="flex flex-1 flex-col">
              <h3 className="mb-1 text-lg font-semibold">Overview</h3>
              <p className="mb-1 text-sm text-white/70">Apartamento {unit.label}</p>
              <div className="grid grid-cols-1 gap-y-2.5">
                <Spec label="Área privativa" value={`${unit.area} m²`} />
                <Spec label="Status" value={STATUS_META[unit.status].label} />
                <Spec label="Preço" value={formatBRL(unit.price)} />
                <Spec label="Tipologia" value={`${unit.suites} suítes`} />
              </div>
            </div>
          </div>
          {/* Opcionais (taller) */}
          <div className={`${card} flex flex-1 gap-5 p-6`}>
            <div className="flex shrink-0 flex-col justify-center">
              <h3 className="text-lg font-semibold">Opcionais</h3>
              <div className="mt-4 flex flex-col gap-2">
                <span className="rounded-lg bg-accent px-1 py-1.5 text-center text-[11px] font-medium">Living ampliado</span>
                <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-center text-[11px] text-white/70">4 suítes</span>
              </div>
            </div>
            <div className="relative ml-auto h-full flex-1 overflow-hidden rounded-2xl bg-white/5">
              <Image src={plantaFor(unit.id)} alt="Planta" fill sizes="22vw" className="object-contain p-3" />
            </div>
          </div>
        </div>

        {/* MIDDLE — selected images */}
        <div className={`${card} flex flex-col gap-2 p-6`}>
          <h3 className="text-lg font-semibold">Imagens<br />selecionadas</h3>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
            <Image src={SEL[0]} alt="" fill sizes="28vw" className="object-cover" />
          </div>
          <div className="grid h-[34%] grid-cols-2 gap-3">
            <div className="relative overflow-hidden rounded-2xl">
              <Image src={SEL[1]} alt="" fill sizes="14vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-2xl">
              <Image src={SEL[2]} alt="" fill sizes="14vw" className="object-cover" />
            </div>
          </div>
        </div>

        {/* RIGHT — QR + share + save */}
        <div className={`${card} flex flex-col p-6`}>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-lg bg-white p-2">
                <QRCodeSVG value={`https://thevertical.app/unidade/${unit.label}`} size={88} level="M" />
              </div>
              <span className="mt-2 rounded-md bg-white/10 px-2 py-0.5 text-xs tracking-widest">AB47KQ</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-snug">Acesse os detalhes desta unidade</p>
              <p className="mt-1 text-[11px] leading-snug text-white/55">
                Escaneie o QR code para continuar a experiência no seu dispositivo.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-2xl font-bold">{formatBRL(unit.price)}</p>
            <p className="text-xs text-white/55">{unit.area} m²</p>
          </div>

          <p className="mt-6 text-sm font-medium">Compartilhar</p>
          <div className="mt-3 flex gap-3">
            <ShareCircle label="Google">
              <span className="text-sm font-bold">G</span>
            </ShareCircle>
            <ShareCircle label="WhatsApp">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z" /></svg>
            </ShareCircle>
            <ShareCircle label="Email">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
            </ShareCircle>
            <ShareCircle label="Mais">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </ShareCircle>
          </div>

          <button
            type="button"
            className="mt-auto w-full rounded-2xl bg-white/90 py-3 text-sm font-semibold text-[#0a1726] transition hover:bg-white"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* bottom dock */}
      <nav className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-end gap-7 rounded-3xl border border-white/20 bg-white/15 px-7 py-2.5 backdrop-blur-xl">
        {[
          { label: "Explorar", panel: "none" as Panel },
          { label: "Apartamentos", panel: "apartments" as Panel },
          { label: "Áreas comuns", panel: "amenities" as Panel },
          { label: "Aproximidades", panel: "surroundings" as Panel },
        ].map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => nav(it.panel)}
            className="flex flex-col items-center gap-1.5 text-white/70 transition hover:text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
              <span className="h-2 w-2 rounded-full bg-current" />
            </span>
            <span className="text-[10px] tracking-[0.14em]">{it.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
