export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET || process.env.COOKIE_SECRET || "default-dev-secret-keep-it-safe",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL || "https://accounts.google.com",

  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY ?? "",
  googleSearchCx: process.env.GOOGLE_SEARCH_CX ?? "",
  bingSearchApiKey: process.env.BING_SEARCH_API_KEY ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
};
