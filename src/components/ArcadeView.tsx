import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bomb,
  Coins,
  FileUp,
  Gamepad2,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { CURRENCY_SHORT } from '../data/economyCatalog';
import type { PlayerSaveProfile } from '../types/game';

interface ArcadeViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenShop: () => void;
  onAwardCoins: (coins: number) => void;
}

type ArcadeTab = 'flash-karp' | 'voltorb-flip' | 'ruffle';

interface FlashEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'magikarp' | 'golden' | 'voltorb';
  ttl: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

/* ==================== Voltorb Flip Board Generator ==================== */
interface FlipCell {
  value: 0 | 1 | 2 | 3; // 0 = Voltorb
  revealed: boolean;
}

function generateVoltorbBoard(): FlipCell[][] {
  const flat: Array<0 | 1 | 2 | 3> = [
    0, 0, 0, 0, 0, 0, // 6 Voltorbs
    3, 3, 2, 2, 2, 2, // Multipliers
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ];
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const grid: FlipCell[][] = [];
  for (let r = 0; r < 5; r++) {
    grid.push(
      flat.slice(r * 5, r * 5 + 5).map((v) => ({ value: v, revealed: false }))
    );
  }
  return grid;
}

export const ArcadeView: React.FC<ArcadeViewProps> = ({
  profile,
  onBackHome,
  onOpenShop,
  onAwardCoins,
}) => {
  const [tab, setTab] = useState<ArcadeTab>('flash-karp');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  /* ---- 1. Falso Flash 2006 Canvas Game State (Magikarp Splash Clicker) ---- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flashRunning, setFlashRunning] = useState(false);
  const [flashScore, setFlashScore] = useState(0);
  const [flashCombo, setFlashCombo] = useState(0);
  const [flashTimeLeft, setFlashTimeLeft] = useState(25);
  const [lastFlashPayout, setLastFlashPayout] = useState<number | null>(null);

  const gameStateRef = useRef<{
    entities: FlashEntity[];
    floats: FloatingText[];
    score: number;
    combo: number;
    seq: number;
    endAt: number;
    spawnAcc: number;
  }>({
    entities: [],
    floats: [],
    score: 0,
    combo: 0,
    seq: 0,
    endAt: 0,
    spawnAcc: 0,
  });

  const startFlashGame = () => {
    setLastFlashPayout(null);
    setBannerMsg(null);
    setFlashScore(0);
    setFlashCombo(0);
    setFlashTimeLeft(25);
    gameStateRef.current = {
      entities: [],
      floats: [],
      score: 0,
      combo: 0,
      seq: 0,
      endAt: performance.now() + 25000,
      spawnAcc: 0,
    };
    setFlashRunning(true);
  };

  useEffect(() => {
    if (!flashRunning || tab !== 'flash-karp') return;
    let rafId = 0;
    let lastTs = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const st = gameStateRef.current;
      const remainingMs = st.endAt - now;

      if (remainingMs <= 0) {
        setFlashRunning(false);
        setFlashTimeLeft(0);
        const payout = Math.max(50, Math.min(2500, Math.round(st.score * 4)));
        setLastFlashPayout(payout);
        onAwardCoins(payout);
        setBannerMsg(
          `🐟 ¡Partida Flash terminada! Ganaste +${payout.toLocaleString()} PokéCoronas depositadas al instante.`
        );
        return;
      }

      setFlashTimeLeft(Math.ceil(remainingMs / 1000));

      // Spawn new retro Flash targets
      st.spawnAcc += dt;
      if (st.spawnAcc >= 0.45 && st.entities.length < 10) {
        st.spawnAcc = 0;
        const roll = Math.random();
        const kind: FlashEntity['kind'] =
          roll < 0.17 ? 'golden' : roll < 0.42 ? 'voltorb' : 'magikarp';
        st.entities.push({
          id: ++st.seq,
          x: 60 + Math.random() * 520,
          y: 350,
          vx: (Math.random() - 0.5) * 180,
          vy: -(240 + Math.random() * 140),
          radius: kind === 'golden' ? 24 : 28,
          kind,
          ttl: 3.4,
        });
      }

      // Physics update (deliberately bouncy 2006 Newgrounds gravity!)
      st.entities = st.entities
        .map((e) => ({
          ...e,
          x: e.x + e.vx * dt,
          y: e.y + e.vy * dt,
          vy: e.vy + 290 * dt,
          vx:
            e.x < e.radius || e.x > 640 - e.radius
              ? -e.vx
              : e.vx,
          ttl: e.ttl - dt,
        }))
        .filter((e) => e.ttl > 0 && e.y < 410);

      st.floats = st.floats
        .map((f) => ({ ...f, y: f.y - 45 * dt, life: f.life - dt }))
        .filter((f) => f.life > 0);

      // Draw retro ugly-charming Flash 2006 vector art!
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        // Sky gradient MS-Paint / Flash 8 style
        const grad = ctx.createLinearGradient(0, 0, 0, 360);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.65, '#38bdf8');
        grad.addColorStop(0.66, '#0284c7');
        grad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Retro Flash sun & water lines
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(570, 52, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        for (let y = 250; y < 355; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(640, y);
          ctx.stroke();
        }

        // Draw entities with thick black Flash outlines
        for (const e of st.entities) {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#000000';

          if (e.kind === 'voltorb') {
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, Math.PI, 0);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
            // Angry eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(-10, -8, 6, 4);
            ctx.fillRect(4, -8, 6, 4);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('BOOM', -14, 15);
          } else {
            // Magikarp (Orange or Shiny Gold!)
            const bodyCol = e.kind === 'golden' ? '#facc15' : '#f97316';
            const finCol = e.kind === 'golden' ? '#fef08a' : '#fde047';
            // Tail
            ctx.fillStyle = finCol;
            ctx.beginPath();
            ctx.moveTo(-e.radius + 4, 0);
            ctx.lineTo(-e.radius - 14, -14);
            ctx.lineTo(-e.radius - 14, 14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Body
            ctx.fillStyle = bodyCol;
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius, e.radius * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Crown fin
            ctx.fillStyle = finCol;
            ctx.beginPath();
            ctx.moveTo(-8, -e.radius * 0.7);
            ctx.lineTo(0, -e.radius - 8);
            ctx.lineTo(8, -e.radius * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Derpy fish eye + open mouth
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(10, -4, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(11, -4, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(e.radius - 2, 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }

        // Floating Flash score texts
        for (const f of st.floats) {
          ctx.font = 'bold 16px "Comic Sans MS", monospace';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(f.text, f.x, f.y);
          ctx.fillStyle = f.color;
          ctx.fillText(f.text, f.x, f.y);
        }

        // Retro HUD strip inside canvas
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, 640, 28);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(
          `SCORE: ${st.score}   COMBO: x${Math.max(1, st.combo)}   TIME: ${Math.ceil(remainingMs / 1000)}s`,
          12,
          19
        );
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [flashRunning, tab, onAwardCoins]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!flashRunning || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 640;
    const cy = ((e.clientY - rect.top) / rect.height) * 360;
    const st = gameStateRef.current;

    for (let i = st.entities.length - 1; i >= 0; i--) {
      const ent = st.entities[i];
      const dist = Math.hypot(cx - ent.x, cy - ent.y);
      if (dist <= ent.radius + 10) {
        st.entities.splice(i, 1);
        if (ent.kind === 'voltorb') {
          st.combo = 0;
          st.score = Math.max(0, st.score - 25);
          st.floats.push({
            x: ent.x - 24,
            y: ent.y,
            text: 'BOOM -25!',
            color: '#f87171',
            life: 0.9,
          });
        } else {
          st.combo += 1;
          const base = ent.kind === 'golden' ? 45 : 15;
          const pts = base + Math.min(20, st.combo * 2);
          st.score += pts;
          st.floats.push({
            x: ent.x - 20,
            y: ent.y,
            text:
              ent.kind === 'golden'
                ? `✨SHINY +${pts}!`
                : `SPLASH +${pts}`,
            color: ent.kind === 'golden' ? '#fde047' : '#86efac',
            life: 0.9,
          });
        }
        setFlashScore(st.score);
        setFlashCombo(st.combo);
        break;
      }
    }
  };

  /* ---- 2. Voltorb Flip — Casino Azulona ---- */
  const [board, setBoard] = useState<FlipCell[][]>(() => generateVoltorbBoard());
  const [flipPot, setFlipPot] = useState(0);
  const [flipOver, setFlipOver] = useState<'playing' | 'boom' | 'cashed'>(
    'playing'
  );

  const resetVoltorbFlip = () => {
    setBoard(generateVoltorbBoard());
    setFlipPot(0);
    setFlipOver('playing');
    setBannerMsg(null);
  };

  const revealFlipCell = (r: number, c: number) => {
    if (flipOver !== 'playing' || board[r][c].revealed) return;
    const val = board[r][c].value;
    const next = board.map((row, ri) =>
      row.map((cell, ci) =>
        ri === r && ci === c ? { ...cell, revealed: true } : cell
      )
    );
    setBoard(next);

    if (val === 0) {
      setFlipPot(0);
      setFlipOver('boom');
      setBannerMsg('💥 ¡Voltorb explotó! Perdiste las fichas de esta ronda.');
      return;
    }

    const nextPot = flipPot === 0 ? val * 60 : Math.min(4000, flipPot * val);
    setFlipPot(nextPot);
  };

  const cashOutVoltorbFlip = () => {
    if (flipPot <= 0 || flipOver !== 'playing') return;
    onAwardCoins(flipPot);
    setFlipOver('cashed');
    setBannerMsg(
      `🪙 ¡Cobraste +${flipPot.toLocaleString()} PokéCoronas del Casino Azulona!`
    );
  };

  /* ---- 3. Real Ruffle SWF Window ---- */
  const ruffleContainerRef = useRef<HTMLDivElement | null>(null);
  const [ruffleStatus, setRuffleStatus] = useState<string>(
    'Sube cualquier archivo .swf local para ejecutarlo con Ruffle (emulador Flash WASM).'
  );
  const [ruffleTicketClaimed, setRuffleTicketClaimed] = useState(false);

  const handleLoadSwfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRuffleStatus(`Cargando motor Ruffle para ${file.name}...`);
    try {
      const win = window as unknown as {
        RufflePlayer?: {
          newest: () => {
            createPlayer: () => HTMLElement & { load: (url: string) => void };
          };
        };
      };
      if (!win.RufflePlayer) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/@ruffle-rs/ruffle';
          s.onload = () => res();
          s.onerror = () => rej(new Error('No se pudo cargar ruffle.js desde CDN.'));
          document.head.appendChild(s);
        });
      }
      const ruffle = win.RufflePlayer?.newest();
      const player = ruffle?.createPlayer();
      if (player && ruffleContainerRef.current) {
        ruffleContainerRef.current.innerHTML = '';
        player.style.width = '100%';
        player.style.height = '380px';
        ruffleContainerRef.current.appendChild(player);
        const blobUrl = URL.createObjectURL(file);
        player.load(blobUrl);
        setRuffleStatus(`Ejecutando ${file.name} en Ruffle.`);
      }
    } catch (err) {
      setRuffleStatus(
        err instanceof Error ? err.message : 'Error al inicializar Ruffle.'
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-7">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                <Gamepad2 className="h-3.5 w-3.5" />
                Arcade del Castillo · Farmear PokéCoronas
              </p>
              <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Minijuegos Retro Flash & Casino
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-500/15 px-3.5 py-2 text-xs font-extrabold text-amber-200">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-mono-code text-sm">
                {profile.coins.toLocaleString()} {CURRENCY_SHORT}
              </span>
            </div>
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Tienda
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className="mb-5 rounded-2xl border border-emerald-400/45 bg-emerald-500/15 px-4 py-3 text-xs font-bold text-emerald-200">
            {bannerMsg}
          </div>
        )}

        {/* Arcade Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setTab('flash-karp')}
            className={`rounded-xl border px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'flash-karp'
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            🐟 Magikarp Flash 2006 (Canvas)
          </button>
          <button
            onClick={() => setTab('voltorb-flip')}
            className={`rounded-xl border px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'voltorb-flip'
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            💣 Voltorb Flip (Casino Azulona)
          </button>
          <button
            onClick={() => setTab('ruffle')}
            className={`rounded-xl border px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'ruffle'
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            📼 Ventana Ruffle (.swf)
          </button>
        </div>

        {/* TAB 1: RETRO FLASH 2006 WINDOW */}
        {tab === 'flash-karp' && (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border-2 border-slate-500 bg-[#d4d0c8] text-slate-950 shadow-2xl">
            {/* Authentic 2006 Macromedia Flash Player 8 Titlebar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0a246a] via-[#1b56b3] to-[#a6caf0] px-3 py-1.5 text-white">
              <span className="font-mono-code text-xs font-bold">
                Macromedia Flash Player 8 — magikarp_splash_2006.swf
              </span>
              <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono-code text-[10px]">
                QUALITY: LOW · NEWGROUNDS MODE
              </span>
            </div>

            <div className="p-3">
              <div className="relative overflow-hidden border-2 border-slate-700 bg-sky-900">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onClick={handleCanvasClick}
                  className="block w-full cursor-crosshair select-none"
                />
                {!flashRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center text-white">
                    <p className="font-mono-code text-xs font-bold uppercase tracking-widest text-yellow-300">
                      ★ CASTILLO ARCADE FLASH 2006 ★
                    </p>
                    <h2 className="font-display mt-1 text-2xl font-extrabold text-white">
                      ¡Entrena al Magikarp!
                    </h2>
                    <p className="mt-2 max-w-md text-xs text-slate-300">
                      Haz clic en los <strong>Magikarp (+15)</strong> y{' '}
                      <strong className="text-yellow-300">
                        Magikarp Shiny (+45)
                      </strong>{' '}
                      antes de que caigan al agua. ¡Evita los{' '}
                      <strong className="text-rose-400">Voltorb (-25)</strong>!
                      Tu puntaje × 4 se deposita directo en PokéCoronas.
                    </p>
                    {lastFlashPayout !== null && (
                      <p className="mt-3 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-1.5 text-xs font-extrabold text-emerald-200">
                        <Trophy className="mr-1 inline h-3.5 w-3.5" />
                        Último pago: +{lastFlashPayout.toLocaleString()} {CURRENCY_SHORT}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={startFlashGame}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-yellow-200 bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg hover:bg-yellow-300 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      {lastFlashPayout !== null ? 'Jugar otra vez (25s)' : 'JUGAR FLASH (25s)'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono-code text-[11px] font-bold text-slate-800">
                <span>
                  Score: {flashScore} · Combo: x{Math.max(1, flashCombo)} · Tiempo: {flashTimeLeft}s
                </span>
                <span>Pago estimado: +{Math.max(50, flashScore * 4)} {CURRENCY_SHORT}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOLTORB FLIP */}
        {tab === 'voltorb-flip' && (
          <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/35 bg-slate-900/90 p-5 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-emerald-200">
                  Voltorb Flip · Casino Azulona
                </h2>
                <p className="text-xs text-slate-400">
                  Encuentra multiplicadores ×2 y ×3 usando las pistas de fila/columna. Cobra antes de tocar un Voltorb.
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-right">
                <p className="text-[9px] uppercase text-amber-200/80">Pozo actual</p>
                <p className="font-mono-code text-base font-extrabold text-amber-300">
                  {flipPot.toLocaleString()} {CURRENCY_SHORT}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {board.map((row, r) => {
                const rowSum = row.reduce((a, c) => a + c.value, 0);
                const rowBombs = row.filter((c) => c.value === 0).length;
                return (
                  <React.Fragment key={`r-${r}`}>
                    {row.map((cell, c) => (
                      <button
                        key={`c-${r}-${c}`}
                        type="button"
                        disabled={cell.revealed || flipOver !== 'playing'}
                        onClick={() => revealFlipCell(r, c)}
                        className={`flex aspect-square items-center justify-center rounded-xl border text-base font-extrabold transition ${
                          cell.revealed
                            ? cell.value === 0
                              ? 'border-rose-500 bg-rose-600/30 text-rose-200'
                              : cell.value > 1
                                ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                                : 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                            : 'border-emerald-500/45 bg-emerald-900/50 text-emerald-200 hover:border-amber-400 hover:bg-emerald-800/70 cursor-pointer'
                        }`}
                      >
                        {cell.revealed ? (
                          cell.value === 0 ? (
                            <Bomb className="h-5 w-5 text-rose-400" />
                          ) : (
                            `×${cell.value}`
                          )
                        ) : (
                          '?'
                        )}
                      </button>
                    ))}
                    {/* Row Hint */}
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-950/90 p-1 font-mono-code text-[10px]">
                      <span className="font-bold text-amber-300">{rowSum} pts</span>
                      <span className="text-rose-400">💣 {rowBombs}</span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Column Hints */}
              {[0, 1, 2, 3, 4].map((c) => {
                const colSum = board.reduce((a, row) => a + row[c].value, 0);
                const colBombs = board.filter((row) => row[c].value === 0).length;
                return (
                  <div
                    key={`col-${c}`}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-950/90 py-1.5 font-mono-code text-[10px]"
                  >
                    <span className="font-bold text-amber-300">{colSum} pts</span>
                    <span className="text-rose-400">💣 {colBombs}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-[10px] text-slate-500">
                5×5
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={resetVoltorbFlip}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-200 hover:border-amber-400/50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nuevo Tablero
              </button>
              <button
                type="button"
                disabled={flipPot <= 0 || flipOver !== 'playing'}
                onClick={cashOutVoltorbFlip}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 disabled:opacity-40 cursor-pointer"
              >
                <Coins className="h-4 w-4" />
                Cobrar +{flipPot.toLocaleString()} {CURRENCY_SHORT}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: REAL RUFFLE SWF PLAYER */}
        {tab === 'ruffle' && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/85 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-amber-200">
                  Emulador Ruffle (Flash .SWF real)
                </h2>
                <p className="text-xs text-slate-400">{ruffleStatus}</p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer">
                <FileUp className="h-4 w-4" />
                Cargar archivo .SWF
                <input
                  type="file"
                  accept=".swf"
                  onChange={(e) => void handleLoadSwfFile(e)}
                  className="hidden"
                />
              </label>
            </div>

            <div
              ref={ruffleContainerRef}
              className="flex h-[380px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-black/70 p-4 text-center text-xs text-slate-400"
            >
              Cuando armes tu propio juego Flash feo (.swf), cárgalo aquí con el botón superior y Ruffle lo ejecutará directo en el navegador.
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[11px] text-slate-400">
                Recompensa de asistencia del Arcade Ruffle:
              </span>
              <button
                type="button"
                disabled={ruffleTicketClaimed}
                onClick={() => {
                  setRuffleTicketClaimed(true);
                  onAwardCoins(250);
                  setBannerMsg(
                    '🎟️ ¡Ticket del Arcade Ruffle canjeado! +250 PokéCoronas añadidas.'
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {ruffleTicketClaimed
                  ? 'Ticket canjeado esta sesión'
                  : 'Canjear Ticket (+250 PC)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
