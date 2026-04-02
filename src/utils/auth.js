// utils/auth.js

// Decode JWT safely
export function parseJwt(token) {
  try {
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}

// Check if token expired
export function isTokenExpired(token) {
  const decoded = parseJwt(token);
  if (!decoded) return true;

  const now = Date.now() / 1000;
  return decoded.exp < now;
}