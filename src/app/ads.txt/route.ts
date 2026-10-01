import { ADS_CONFIG, adsenseActive } from "@/config/ads";

/** Fichier /ads.txt généré dynamiquement selon la configuration de src/config/ads.ts.
 *  Google AdSense exige ce fichier à la racine du domaine pour valider les revenus. */
export function GET() {
  const lines: string[] = [];

  if (adsenseActive()) {
    const pub = ADS_CONFIG.adsense.clientId.trim().replace(/^ca-/, "");
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  }

  for (const extra of ADS_CONFIG.adsTxtExtra) {
    if (extra && extra.trim()) lines.push(extra.trim());
  }

  const body =
    lines.length > 0
      ? lines.join("\n") + "\n"
      : "# ads.txt — ajoutez votre identifiant AdSense ou vos lignes réseau CPM dans src/config/ads.ts\n";

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
