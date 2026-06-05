"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { STATUS_META, formatBRL, type Unit } from "@/lib/apartments";
import { plantaFor } from "@/lib/plantas";
import Dock from "@/components/dock";

function ShareCircle({ children, label }: { children?: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 text-white/85 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

export default function ShareScreen({ unit, onClose }: { unit: Unit; onClose: () => void }) {
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
      <div className="absolute left-1/2 top-[46%] grid h-[64vh] w-[88vw] -translate-x-1/2 -translate-y-1/2 grid-cols-[1.15fr_1fr_0.82fr] items-stretch gap-4">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          {/* Overview — title above, building left, specs right */}
          <div className={`${card} relative h-[58%] overflow-hidden p-6`}>
            <h3
              style={{ fontFamily: "var(--font-recia), Georgia, serif" }}
              className="absolute left-7 top-5 z-10 text-3xl font-semibold tracking-wide"
            >
              Overview
            </h3>

            {/* building */}
            <div className="absolute bottom-5 left-7 top-20 w-[42%] overflow-hidden rounded-xl">
              <Image src="/frames/explore/0156.webp" alt="Torre" fill sizes="22vw" className="object-cover" />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-md bg-accent px-3 py-2 text-base font-semibold shadow-lg">
                {unit.label}
              </span>
            </div>

            {/* specs (right-aligned, top→bottom) */}
            <div className="absolute bottom-6 right-7 top-6 flex flex-col items-end justify-between text-right">
              <div>
                <p className="text-sm text-white/70">Apartamento</p>
                <p className="text-2xl font-semibold leading-tight">{unit.label}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Área privativa</p>
                <p className="text-base font-semibold">{unit.area}m²</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Status</p>
                <p className="text-base font-semibold">{STATUS_META[unit.status].label}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/90">Preço:</p>
                <p className="text-base font-semibold">{formatBRL(unit.price)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Tipologia</p>
                <p className="text-base font-semibold leading-tight">Living ampliado</p>
                <p className="text-base font-semibold leading-tight">{unit.suites} suítes</p>
              </div>
            </div>
          </div>
          {/* Opcionais (taller) — plan fills, options along the bottom */}
          <div className={`${card} flex flex-1 flex-col gap-3 p-5`}>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <h3 className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-2xl font-semibold">Opcionais</h3>
              <Image src={plantaFor(unit.id)} alt="Planta" fill sizes="40vw" className="scale-[1.9] object-contain" />
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2">
              <span className="rounded-full bg-accent px-3 py-2 text-center text-[11px] font-medium leading-tight">
                Isolamento de Alto Desempenho
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-center text-[11px] leading-tight text-white/70">
                Janelas com Vidro Duplo
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-center text-[11px] leading-tight text-white/70">
                Controle Climático Inteligente
              </span>
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

        {/* RIGHT — QR + share + download */}
        <div className={`${card} flex flex-col p-7`}>
          {/* QR + code | heading + description */}
          <div className="flex gap-5">
            <div className="flex shrink-0 flex-col gap-3">
              <div className="rounded-xl bg-white p-2.5">
                <QRCodeSVG value={`https://thevertical.app/unidade/${unit.label}`} size={104} level="M" />
              </div>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-3 py-2 text-sm font-medium tracking-wider text-white/90 transition hover:bg-white/10"
              >
                AB47XQ
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold leading-tight">Acesse os detalhes desta unidade</h3>
              <p className="mt-3 text-sm leading-snug text-white/55">
                Use este código para continuar a navegação, compartilhar com um consultor ou acessar mais informações sobre esta residência.
              </p>
            </div>
          </div>

          <hr className="my-6 border-white/15" />

          <div>
            <p className="text-3xl font-bold">{formatBRL(unit.price)}</p>
            <p className="mt-1 text-sm text-white/55">{unit.area} M²</p>
          </div>

          <hr className="my-6 border-white/15" />

          <p className="text-lg font-semibold">Compartilhar</p>
          <div className="mt-4 flex gap-4">
            <ShareCircle label="Google">
              <span className="text-lg font-bold">G</span>
            </ShareCircle>
            <ShareCircle label="WhatsApp">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z" /></svg>
            </ShareCircle>
            <ShareCircle label="Email">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
            </ShareCircle>
            <ShareCircle label="Mais" />
          </div>

          <button
            type="button"
            className="mt-7 w-full rounded-2xl border border-white/30 py-3.5 text-sm font-semibold transition hover:bg-white/10"
          >
            Baixar
          </button>
        </div>
      </div>

      {/* bottom dock — same as Explorar */}
      <Dock onNavigate={onClose} />
    </div>
  );
}
