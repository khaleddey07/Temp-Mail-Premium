import { NextResponse } from "next/server";
import { getActiveTargets } from "@/lib/mailtm";
import { FALLBACK_DOMAINS } from "@/lib/temp-mail";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  mailtm: "mail.tm",
  guerrillamail: "guerrillamail",
};

// GET /api/domains -> domaines réellement actifs (premier fournisseur sain)
export async function GET() {
  try {
    const { provider, domains } = await getActiveTargets();
    return NextResponse.json({ domains, provider: PROVIDER_LABEL[provider] ?? provider });
  } catch {
    return NextResponse.json({ domains: FALLBACK_DOMAINS, provider: "fallback" });
  }
}
