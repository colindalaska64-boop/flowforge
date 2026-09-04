import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /dev : documentation interne de l'équipe, ne doit pas remonter dans les résultats
      disallow: ["/dashboard/", "/admin/", "/api/", "/dev"],
    },
    sitemap: "https://loopflo.app/sitemap.xml",
  };
}
