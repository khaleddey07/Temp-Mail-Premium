import { NextResponse } from "next/server";
import { getActiveDomains } from "@/lib/mailtm";
import { FALLBACK_DOMAINS } from "@/lib/temp-mail";

export const dynamic = "force-dynamic";

// GET /api/domains -> domaines réellement actifs (mail.tm)
export async function GET() {
  try {
    const domains = await getActiveDomains();
    return NextResponse.json({ domains, provider: "mail.tm" });
  } catch {
    return NextResponse.json({ domains: FALLBACK_DOMAINS, provider: "fallback" });
  }
}
