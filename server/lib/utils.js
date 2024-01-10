export function absoluteUrl(path) {
  return `${
    process.env.FRONTEND_CLIENT_PORT || "http://localhost:3000/"
  }${path}`;
}
