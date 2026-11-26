import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Coins,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  getEffectiveFirebaseConfig,
  isFirebaseConfigured,
  registerWithEmail,
  resetFirebaseClientCache,
  saveRuntimeFirebaseConfig,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebase,
  type FirebaseWebConfig,
} from '../engine/firebaseClient';
import type { PlayerSaveProfile } from '../types/game';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  profile: PlayerSaveProfile;
  cloudSyncStatus: 'local' | 'syncing' | 'synced' | 'error';
  onForceCloudSync: () => Promise<void>;
  onFirebaseConfigUpdated: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  onClose,
  firebaseUser,
  profile,
  cloudSyncStatus,
  onForceCloudSync,
  onFirebaseConfigUpdated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  const existingCfg = getEffectiveFirebaseConfig();
  const [cfgForm, setCfgForm] = useState<FirebaseWebConfig>({
    apiKey: existingCfg?.apiKey ?? '',
    authDomain: existingCfg?.authDomain ?? '',
    projectId: existingCfg?.projectId ?? '',
    storageBucket: existingCfg?.storageBucket ?? '',
    messagingSenderId: existingCfg?.messagingSenderId ?? '',
    appId: existingCfg?.appId ?? '',
  });

  if (!open) return null;

  const configured = isFirebaseConfigured();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(
          email,
          password,
          displayName || email.split('@')[0] || 'Entrenador'
        );
        setInfo('¡Cuenta creada y partida vinculada en la nube!');
      } else {
        await signInWithEmail(email, password);
        setInfo('¡Sesión iniciada! Sincronizando tu guardado en Firestore...');
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      setInfo('¡Sesión iniciada con Google!');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOutFirebase();
      setInfo('Sesión cerrada. Tu progreso local sigue seguro en este navegador.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = () => {
    setError(null);
    if (!cfgForm.apiKey || !cfgForm.authDomain || !cfgForm.projectId || !cfgForm.appId) {
      setError('Completa apiKey, authDomain, projectId y appId de tu app Web en Firebase.');
      return;
    }
    saveRuntimeFirebaseConfig(cfgForm);
    resetFirebaseClientCache();
    onFirebaseConfigUpdated();
    setShowConfigEditor(false);
    setInfo('Configuración de Firebase guardada. Ya puedes iniciar sesión con tu correo o Google.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/35 bg-[#090f1e] p-6 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
              {firebaseUser ? (
                <Cloud className="h-5 w-5" />
              ) : (
                <CloudOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Cuenta & Guardado en la Nube
              </h2>
              <p className="text-[11px] text-slate-400">
                Firebase Auth + Firestore (`users/&#123;uid&#125;`)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile quick stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5">
            <p className="text-[10px] uppercase text-amber-200/80">Saldo</p>
            <p className="font-mono-code mt-0.5 flex items-center justify-center gap-1 text-sm font-extrabold text-amber-300">
              <Coins className="h-3.5 w-3.5" />
              {profile.coins.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
            <p className="text-[10px] uppercase text-slate-400">Capítulos</p>
            <p className="font-mono-code mt-0.5 text-sm font-extrabold text-emerald-300">
              {profile.unlockedChapters.length}/15
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
            <p className="text-[10px] uppercase text-slate-400">Shiny Charms</p>
            <p className="font-mono-code mt-0.5 flex items-center justify-center gap-1 text-sm font-extrabold text-fuchsia-300">
              <Sparkles className="h-3.5 w-3.5" />
              {profile.inventory.shinyCharms}/6
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
            {info}
          </div>
        )}

        {firebaseUser ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-emerald-200">
                    Conectado en la nube
                  </p>
                  <p className="text-sm font-extrabold text-white">
                    {firebaseUser.displayName || profile.displayName}
                  </p>
                  <p className="font-mono-code text-[11px] text-slate-300">
                    {firebaseUser.email}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {cloudSyncStatus === 'syncing'
                    ? 'Sincronizando...'
                    : cloudSyncStatus === 'error'
                      ? 'Error sync'
                      : 'Sincronizado'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onForceCloudSync()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-400/45 bg-sky-500/15 px-4 py-2.5 text-xs font-bold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
              >
                <Cloud className="h-4 w-4" />
                Forzar Guardado en Firestore
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSignOut()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        ) : configured ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                  mode === 'register'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                    Nombre de Entrenador
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Luso233"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="entrenador@correo.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  Contraseña (mín. 6 caracteres)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'register' ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {mode === 'register'
                  ? 'Crear Cuenta y Guardar Partida'
                  : 'Entrar y Cargar mi Partida'}
              </button>
            </form>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:border-sky-400/60 hover:bg-slate-800 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              Continuar con Google
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-100">
            <p className="font-bold text-amber-200">
              Modo Invitado Local activo (100% jugable)
            </p>
            <p className="leading-relaxed text-slate-300">
              Tus PokéCoronas, capítulos desbloqueados, inventario, equipo y Shiny Charms se guardan automáticamente en este navegador. Para sincronizar entre dispositivos con correo y Google, conecta tu proyecto gratuito de Firebase (Spark):
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-[11px] text-slate-300">
              <li>
                Crea un proyecto en <strong>console.firebase.google.com</strong> y activa <em>Authentication (Correo + Google)</em> y <em>Cloud Firestore</em>.
              </li>
              <li>
                Agrega <code className="text-amber-200">luso233.github.io</code> y <code className="text-amber-200">localhost</code> en <em>Authorized domains</em>.
              </li>
              <li>
                Pega aquí abajo tu configuración Web o cárgala en <code className="text-amber-200">.env.local</code> / GitHub Secrets.
              </li>
            </ol>
          </div>
        )}

        {/* Collapsible Runtime Firebase Config Panel */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowConfigEditor((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-amber-200 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            {showConfigEditor
              ? 'Ocultar configuración Firebase Web SDK'
              : 'Configurar claves de proyecto Firebase (opcional)'}
          </button>

          {showConfigEditor && (
            <div className="mt-3 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5">
              {(
                [
                  ['apiKey', 'apiKey (VITE_FIREBASE_API_KEY)'],
                  ['authDomain', 'authDomain (ej. tu-app.firebaseapp.com)'],
                  ['projectId', 'projectId'],
                  ['storageBucket', 'storageBucket (opcional)'],
                  ['messagingSenderId', 'messagingSenderId (opcional)'],
                  ['appId', 'appId'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="mb-0.5 block text-[10px] font-semibold text-slate-400">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={cfgForm[field] ?? ''}
                    onChange={(e) =>
                      setCfgForm((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    className="font-mono-code w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    saveRuntimeFirebaseConfig(null);
                    resetFirebaseClientCache();
                    onFirebaseConfigUpdated();
                    setInfo('Claves locales limpiadas.');
                  }}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-[11px] font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
                >
                  Guardar Firebase Config
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
