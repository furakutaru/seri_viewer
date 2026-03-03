export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Google OAuthを使用
  const oauthPortalUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const appId = import.meta.env.VITE_APP_ID || "your-google-client-id";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(oauthPortalUrl);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return url.toString();
  } catch (e) {
    console.error("Invalid OAuth URL:", oauthPortalUrl);
    return "#error-invalid-auth-url";
  }
};
