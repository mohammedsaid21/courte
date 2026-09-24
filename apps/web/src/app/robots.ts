import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account/", "/login", "/signup", "/verify", "/forgot-password", "/reset-password"] }],
  };
}
