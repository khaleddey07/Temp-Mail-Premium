/**
 * Client mail.tm côté serveur — réception de VRAIS e-mails.
 * Aucune clé secrète : mail.tm est une API publique (8 req/s max par IP).
 * Toutes les fonctions gèrent : re-auth automatique (401), retry 429/5xx.
 */

const API = "https://api.mail.tm";

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

/* ================= Fetch robuste (retry 429 / 5xx) ================= */
async function mtFetch(path: string, init: RequestInit = {}, retries = 2): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API + path, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastRes = res;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return lastRes as Response;
}

/* ================= Domaines (cache mémoire 10 min) ================= */
let domainCache: { at: number; domains: string[] } | null = null;

export async function getActiveDomains(): Promise<string[]> {
  if (domainCache && Date.now() - domainCache.at < 10 * 60 * 1000 && domainCache.domains.length > 0) {
    return domainCache.domains;
  }
  const res = await mtFetch("/domains?page=1");
  if (!res.ok) throw new Error(`domains ${res.status}`);
  const data = await res.json();
  const members: MtDomain[] = data["hydra:member"] ?? data ?? [];
  const domains = members.filter((d) => d.isActive && !d.isPrivate).map((d) => d.domain);
  if (domains.length === 0) throw new Error("Aucun domaine actif chez le fournisseur");
  domainCache = { at: Date.now(), domains };
  return domains;
}

/* ================= Compte : création / login ================= */
export function randomPassword(): string {
  const abc = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 14; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

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
  const res = await mtFetch("/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = await res.json();
  return data.token as string;
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

/* ================= Auth + re-auth automatique ================= */
interface AuthCreds {
  email: string;
  providerId: string | null;
  providerPassword: string | null;
  providerToken: string | null;
}

export async function authedFetch(
  creds: AuthCreds,
  path: string,
  init: RequestInit = {},
  // setToken permet au caller de persister un token rafraîchi
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
    const fresh = await login(creds.email, creds.providerPassword);
    setToken?.(fresh);
    creds.providerToken = fresh;
    res = await doFetch(fresh);
  }
  return res;
}

/* ================= Messages ================= */
export async function listMessages(
  creds: AuthCreds,
  setToken?: (t: string) => void
): Promise<MtMessageSummary[]> {
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
  const res = await authedFetch(creds, `/messages/${messageId}`, { method: "DELETE" }, setToken);
  return res.status === 204;
}

/** Téléchargement d'une pièce jointe : /messages/{msgId}/attachment/{attId} */
export async function fetchAttachment(
  creds: AuthCreds,
  messageId: string,
  attachmentId: string,
  setToken?: (t: string) => void
): Promise<Response> {
  return authedFetch(creds, `/messages/${messageId}/attachment/${attachmentId}`, {}, setToken);
}
