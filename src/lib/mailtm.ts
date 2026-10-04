/**
 * Client multi-fournisseurs côté serveur — réception de VRAIS e-mails.
 *
 * Fournisseurs (essayés dans l'ordre, MAIL_PROVIDER_ORDER pour surcharger) :
 *  1. mail.tm / mail.gw (API identique, URLs surchargeables via MAIL_PROVIDERS)
 *  2. GuerrillaMail (api.guerrillamail.com) — service simple SANS blocage
 *     datacenter : fonctionne depuis Vercel même quand mail.tm refuse nos IP.
 *
 * Convention de stockage dans la base (colonne providerId) :
 *  - « gmr:<sid_token> » → adresse GuerrillaMail (sid = session secrète)
 *  - tout le reste       → compte mail.tm (comportement historique)
 * Toutes les fonctions gèrent : re-auth automatique, retry 429/5xx, bascule.
 */

/** URLs de la famille mail.tm (surchargeable — virgules). */
const PROVIDERS: string[] = (
  process.env.MAIL_PROVIDERS?.trim() || "https://api.mail.tm,https://api.mail.gw"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Ordre des fournisseurs : "guerrillamail" d'abord — mail.tm bloque les IP
 *  datacenter de Vercel (503 constaté en production). Mail.tm reste en secours
 *  automatique et redevient prioritaire via MAIL_PROVIDER_ORDER si besoin. */
const ORDER: string[] = (
  process.env.MAIL_PROVIDER_ORDER?.trim() || "guerrillamail,mailtm"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Fournisseur mémorisé dès qu'un répond correctement. */
let activeProvider: string | null = null;

/** Base mail.tm mémorisée (favori parmi PROVIDERS). */
let activeApi: string | null = null;

/** User-Agent identifié — certains CDN refusent les requêtes sans UA depuis des IP datacenter. */
const UA =
  "Mozilla/5.0 (compatible; TempMailPremium/1.0; +https://temp-mail-premium.vercel.app)";

/* ================= Types ================= */
export interface MtDomain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
}

export interface MtMessageSummary {
  id: string;
  from: { name?: string; address: string };
  to: { name?: string; address: string }[];
  subject: string;
  intro: string;
  seen: boolean;
  hasAttachments: boolean;
  size: number;
  createdAt: string;
}

export interface MtAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
}

export interface MtMessageFull extends MtMessageSummary {
  text?: string;
  html?: string[];
  attachments?: MtAttachment[];
}

export type ProviderName = "mailtm" | "guerrillamail";

export interface CreatedMailbox {
  provider: ProviderName;
  /** mail.tm : identifiant de compte — guerrilla : « gmr:<sid_token> » */
  providerId: string;
  email: string;
  /** mail.tm : mot de passe — guerrilla : null (pas de compte) */
  password: string | null;
  /** mail.tm : token Bearer — guerrilla : sid_token */
  token: string | null;
  domain: string;
  local: string;
}

interface AuthCreds {
  email: string;
  providerId: string | null;
  providerPassword: string | null;
  providerToken: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ================================================================== */
/* ============ Fournisseur 1 : famille mail.tm / mail.gw =========== */
/* ================================================================== */

async function tryFetch(base: string, path: string, init: RequestInit): Promise<Response> {
  return fetch(base + path, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(10000),
  });
}

async function mtFetch(path: string, init: RequestInit = {}, retries = 1): Promise<Response> {
  const bases = activeApi
    ? [activeApi, ...PROVIDERS.filter((p) => p !== activeApi)]
    : [...PROVIDERS];
  let lastRes: Response | null = null;
  let lastErr: unknown = null;

  for (const base of bases) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await tryFetch(base, path, init);
        if (res.status === 429 || res.status >= 500) {
          lastRes = res;
          lastErr = null;
          if (attempt < retries) await sleep(600 * (attempt + 1));
          continue;
        }
        activeApi = base;
        return res;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await sleep(600 * (attempt + 1));
      }
    }
    if (activeApi === base) activeApi = null;
  }

  if (lastRes) return lastRes;
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Aucun fournisseur mail joignable");
}

async function mailtmDomains(): Promise<string[]> {
  const res = await mtFetch("/domains?page=1");
  if (!res.ok) throw new Error(`domains ${res.status}`);
  const data = await res.json();
  const members: MtDomain[] = data["hydra:member"] ?? data ?? [];
  const domains = members.filter((d) => d.isActive && !d.isPrivate).map((d) => d.domain);
  if (domains.length === 0) throw new Error("Aucun domaine actif chez le fournisseur");
  return domains;
}

async function mailtmCreate(local: string, domainRaw?: string): Promise<CreatedMailbox> {
  const domains = await mailtmDomains();
  const domain = domainRaw && domains.includes(domainRaw) ? domainRaw : domains[0];
  const password = randomPassword();
  const res = await mtFetch("/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: `${local}@${domain}`, password }),
  });
  if (res.status === 422) throw new Error("ADDRESS_TAKEN");
  if (!res.ok) throw new Error(`account ${res.status}`);
  const account = await res.json();

  let token: string | null = null;
  try {
    token = await mailtmLogin(`${local}@${domain}`, password);
  } catch {
    token = null;
  }
  return {
    provider: "mailtm",
    providerId: String(account.id),
    email: `${local}@${domain}`,
    password,
    token,
    domain,
    local,
  };
}

async function mailtmLogin(address: string, password: string): Promise<string> {
  const res = await mtFetch("/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

/* ================================================================== */
/* ================= Fournisseur 2 : GuerrillaMail ================== */
/* ================================================================== */

const GMR_BASE = "https://api.guerrillamail.com/ajax.php";

/** Appel JSON GuerrillaMail ; lève GMR_AUTH si la session est refusée. */
async function gmrJson(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = `${GMR_BASE}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`guerrilla ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const auth = data.auth as { success?: boolean } | undefined;
  if (auth && auth.success === false) throw new Error("GMR_AUTH");
  return data;
}

/** Appel brut (pièces jointes binaires). */
async function gmrRaw(params: Record<string, string>): Promise<Response> {
  const url = `${GMR_BASE}?${new URLSearchParams(params).toString()}`;
  return fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
}

/** Nouvelle session + attribution de la boîte (ré-auth possible : la boîte
 *  est retrouvée à partir du nom, contenu du sid expiré). */
async function gmrOpenMailbox(local: string): Promise<{ email: string; sid: string }> {
  const init = await gmrJson({ f: "get_email_address" });
  const sid0 = String(init.sid_token ?? "");
  const set = await gmrJson({ f: "set_email_user", email_user: local, sid_token: sid0 });
  const email = String(set.email_addr ?? init.email_addr ?? `${local}@guerrillamailblock.com`);
  const sid = String(set.sid_token ?? sid0);
  if (!email.includes("@")) throw new Error("guerrilla adresse invalide");
  return { email, sid };
}

async function gmrReauth(creds: AuthCreds, setToken?: (t: string) => void): Promise<string> {
  const local = creds.email.split("@")[0];
  const { email, sid } = await gmrOpenMailbox(local);
  creds.email = email;
  creds.providerToken = sid;
  setToken?.(sid);
  return sid;
}

function gmrProviderId(sid: string): string {
  return `gmr:${sid}`;
}

function isGuerrilla(creds: AuthCreds): boolean {
  return !!creds.providerId?.startsWith("gmr:");
}

interface GmrListItem {
  mail_id?: number | string;
  mail_from?: string;
  mail_subject?: string;
  mail_excerpt?: string;
  mail_timestamp?: number;
  mail_read?: number | boolean;
  att?: number | unknown[];
}

function parseFrom(raw: string | undefined): { name?: string; address: string } {
  const value = (raw ?? "").trim();
  const angle = /^.*<([^>]+)>\s*$/.exec(value);
  const address = angle ? angle[1] : value || "inconnu@inconnu";
  const name = angle ? value.slice(0, value.lastIndexOf("<")).trim().replace(/^"|"$/g, "") : value.split("@")[0];
  return { name: name || address.split("@")[0], address };
}

function gmrTimestamp(item: GmrListItem): string {
  const ts = Number(item.mail_timestamp ?? 0);
  return new Date(ts > 0 ? ts * 1000 : Date.now()).toISOString();
}

function gmrHasAttachments(item: GmrListItem): boolean {
  return Array.isArray(item.att) ? item.att.length > 0 : Number(item.att ?? 0) > 0;
}

async function gmrList(creds: AuthCreds, setToken?: (t: string) => void): Promise<MtMessageSummary[]> {
  const run = async (sid: string) => {
    try {
      return await gmrJson({ f: "get_email_list", offset: "0", sid_token: sid });
    } catch {
      return await gmrJson({ f: "check_email", seq: "0", sid_token: sid });
    }
  };

  let data: Record<string, unknown>;
  try {
    data = await run(String(creds.providerToken ?? ""));
  } catch {
    // sid expiré → ré-ouvrir la MÊME boîte (le nom détermine la boîte) puis réessayer
    const sid = await gmrReauth(creds, setToken);
    data = await run(sid);
  }

  const list = (data.list ?? []) as GmrListItem[];
  return list.map((item) => {
    const from = parseFrom(item.mail_from);
    const id = String(item.mail_id ?? "");
    return {
      id,
      from,
      to: [{ address: creds.email }],
      subject: item.mail_subject || "(sans objet)",
      intro: (item.mail_excerpt || "").replace(/\s+/g, " ").trim(),
      seen: Number(item.mail_read ?? 0) === 1,
      hasAttachments: gmrHasAttachments(item),
      size: 0,
      createdAt: gmrTimestamp(item),
    } satisfies MtMessageSummary;
  });
}

interface GmrFull {
  mail_id?: number | string;
  mail_from?: string;
  mail_subject?: string;
  mail_body?: string;
  mail_timestamp?: number;
  mail_read?: number | boolean;
  content_type?: string;
  att?: unknown[];
}

interface GmrAtt {
  f?: string;
  t?: string;
  n?: number;
}

async function gmrFull(
  creds: AuthCreds,
  messageId: string,
  setToken?: (t: string) => void
): Promise<MtMessageFull> {
  const fetchOne = (sid: string) =>
    gmrJson({ f: "fetch_email", email_id: messageId, sid_token: sid }) as Promise<unknown>;

  let raw: unknown;
  try {
    raw = await fetchOne(String(creds.providerToken ?? ""));
  } catch {
    const sid = await gmrReauth(creds, setToken);
    raw = await fetchOne(sid);
  }
  const mail = (raw ?? {}) as GmrFull;
  const from = parseFrom(mail.mail_from);
  const body = mail.mail_body ?? "";
  // GuerrillaMail marque parfois « text » un corps contenant du HTML (<pre>…) :
  // on détecte le HTML réel pour un rendu propre dans le lecteur.
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(body);

  const atts = Array.isArray(mail.att) ? (mail.att as GmrAtt[]) : [];
  const attachments: MtAttachment[] = atts.map((a, i) => ({
    id: `${mail.mail_id ?? messageId}_${i + 1}`,
    filename: a.f || `piece-jointe-${i + 1}`,
    contentType: a.t || "application/octet-stream",
    size: Number(a.n ?? 0),
    downloadUrl: "",
  }));

  return {
    id: String(mail.mail_id ?? messageId),
    from,
    to: [{ address: creds.email }],
    subject: mail.mail_subject || "(sans objet)",
    intro: "",
    seen: Number(mail.mail_read ?? 0) === 1,
    hasAttachments: attachments.length > 0,
    size: 0,
    createdAt: gmrTimestamp(mail),
    text: !looksHtml ? body || undefined : undefined,
    html: looksHtml && body ? [body] : undefined,
    attachments,
  };
}

/* ================================================================== */
/* ============ Sélection du fournisseur + domaines actifs =========== */
/* ================================================================== */

interface Targets {
  provider: ProviderName;
  domains: string[];
}
let targetsCache: { at: number; targets: Targets } | null = null;

/** Fournisseur sain + ses domaines (cache 10 min). Lève si TOUS échouent. */
export async function getActiveTargets(): Promise<Targets> {
  if (targetsCache && Date.now() - targetsCache.at < 10 * 60 * 1000) {
    return targetsCache.targets;
  }

  const order = activeProvider
    ? [activeProvider, ...ORDER.filter((p) => p !== activeProvider)]
    : [...ORDER];

  let lastErr: unknown = null;
  for (const provider of order) {
    try {
      if (provider === "mailtm") {
        const domains = await mailtmDomains();
        const targets: Targets = { provider: "mailtm", domains };
        activeProvider = "mailtm";
        targetsCache = { at: Date.now(), targets };
        return targets;
      }
      if (provider === "guerrillamail") {
        const probe = await gmrOpenMailbox(`probe${Date.now().toString(36)}`);
        const domain = probe.email.split("@")[1];
        const targets: Targets = { provider: "guerrillamail", domains: [domain] };
        activeProvider = "guerrillamail";
        targetsCache = { at: Date.now(), targets };
        return targets;
      }
    } catch (err) {
      lastErr = err;
      if (activeProvider === provider) activeProvider = null;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Aucun fournisseur mail joignable");
}

/** Compatibilité : domaines du fournisseur actif. */
export async function getActiveDomains(): Promise<string[]> {
  return (await getActiveTargets()).domains;
}

/* ================= Compte : création / login ================= */
export function randomPassword(): string {
  const abc = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 14; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

/** Crée une boîte réelle chez le PREMIER fournisseur sain.
 *  Lève ADDRESS_TAKEN si le nom est déjà pris (mail.tm uniquement). */
export async function createMailbox(local: string, domainRaw?: string): Promise<CreatedMailbox> {
  const targets = await getActiveTargets();
  if (targets.provider === "guerrillamail") {
    const { email, sid } = await gmrOpenMailbox(local);
    return {
      provider: "guerrillamail",
      providerId: gmrProviderId(sid),
      email,
      password: null,
      token: sid,
      domain: email.split("@")[1],
      local: email.split("@")[0],
    };
  }
  return mailtmCreate(local, domainRaw);
}

/** Compat : création famille mail.tm uniquement. */
export async function createAccount(
  address: string,
  password: string
): Promise<{ id: string; address: string }> {
  const res = await mtFetch("/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (res.status === 422) throw new Error("ADDRESS_TAKEN");
  if (!res.ok) throw new Error(`account ${res.status}`);
  return res.json();
}

export async function login(address: string, password: string): Promise<string> {
  return mailtmLogin(address, password);
}

export async function deleteAccount(accountId: string, token: string): Promise<boolean> {
  try {
    const res = await mtFetch(`/accounts/${accountId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status === 204;
  } catch {
    return false;
  }
}

/* ================= Auth + re-auth automatique (mail.tm) ================= */
export async function authedFetch(
  creds: AuthCreds,
  path: string,
  init: RequestInit = {},
  setToken?: (t: string) => void
): Promise<Response> {
  const doFetch = (tok: string) =>
    mtFetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${tok}`, ...(init.headers ?? {}) },
    });

  let res = creds.providerToken ? await doFetch(creds.providerToken) : null;
  if (!res || res.status === 401) {
    if (!creds.providerPassword) throw new Error("PROVIDER_AUTH_FAILED");
    const fresh = await mailtmLogin(creds.email, creds.providerPassword);
    setToken?.(fresh);
    creds.providerToken = fresh;
    res = await doFetch(fresh);
  }
  return res;
}

/* ================= Messages (dispatch selon fournisseur) ================= */
export async function listMessages(
  creds: AuthCreds,
  setToken?: (t: string) => void
): Promise<MtMessageSummary[]> {
  if (isGuerrilla(creds)) return gmrList(creds, setToken);

  const res = await authedFetch(creds, "/messages?page=1", {}, setToken);
  if (res.status === 401) throw new Error("PROVIDER_AUTH_FAILED");
  if (!res.ok) throw new Error(`messages ${res.status}`);
  const data = await res.json();
  return (data["hydra:member"] ?? data ?? []) as MtMessageSummary[];
}

export async function getMessage(
  creds: AuthCreds,
  messageId: string,
  setToken?: (t: string) => void
): Promise<MtMessageFull> {
  if (isGuerrilla(creds)) return gmrFull(creds, messageId, setToken);

  const res = await authedFetch(creds, `/messages/${messageId}`, {}, setToken);
  if (!res.ok) throw new Error(`message ${res.status}`);
  return res.json();
}

export async function markSeen(
  creds: AuthCreds,
  messageId: string,
  seen: boolean,
  setToken?: (t: string) => void
): Promise<boolean> {
  if (isGuerrilla(creds)) return true; // GuerrillaMail gère la lecture côté fetch

  try {
    const res = await authedFetch(
      creds,
      `/messages/${messageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify({ seen }),
      },
      setToken
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteMessage(
  creds: AuthCreds,
  messageId: string,
  setToken?: (t: string) => void
): Promise<boolean> {
  if (isGuerrilla(creds)) {
    try {
      const run = (sid: string) =>
        gmrJson({ f: "del_email", "email_ids[]": messageId, sid_token: sid });
      try {
        await run(String(creds.providerToken ?? ""));
      } catch {
        const sid = await gmrReauth(creds, setToken);
        await run(sid);
      }
      return true;
    } catch {
      return false;
    }
  }

  const res = await authedFetch(creds, `/messages/${messageId}`, { method: "DELETE" }, setToken);
  return res.status === 204;
}

/** Téléchargement d'une pièce jointe.
 *  mail.tm : /messages/{msgId}/attachment/{attId} — guerrilla : « mailId_index » */
export async function fetchAttachment(
  creds: AuthCreds,
  messageId: string,
  attachmentId: string,
  setToken?: (t: string) => void
): Promise<Response> {
  if (isGuerrilla(creds)) {
    const [emailId, attIdx] = attachmentId.split("_");
    const run = (sid: string) =>
      gmrRaw({ f: "att", email_id: emailId, att_id: attIdx, sid_token: sid });
    let res = await run(String(creds.providerToken ?? ""));
    if (!res.ok) {
      const sid = await gmrReauth(creds, setToken);
      res = await run(sid);
    }
    return res;
  }
  return authedFetch(creds, `/messages/${messageId}/attachment/${attachmentId}`, {}, setToken);
}
