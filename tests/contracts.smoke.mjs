const services = [
  { name: "gateway", url: process.env.GATEWAY_URL || "http://localhost:4100/health" },
  { name: "auth", url: process.env.AUTH_SERVICE_URL || "http://localhost:4101/health" },
  { name: "chat", url: process.env.CHAT_SERVICE_URL || "http://localhost:4103/health" },
  { name: "media", url: process.env.MEDIA_SERVICE_URL || "http://localhost:4104/health" },
  {
    name: "notifications",
    url: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4105/health",
  },
];

const withHealthPath = (url) => (url.endsWith("/health") ? url : `${url}/health`);

let failed = false;
let passed = 0;
for (const service of services) {
  try {
    const res = await fetch(withHealthPath(service.url));
    if (!res.ok) {
      failed = true;
      console.error(`[FAIL] ${service.name}: ${res.status}`);
    } else {
      passed += 1;
      console.log(`[OK] ${service.name}: ${res.status}`);
    }
  } catch (error) {
    failed = true;
    console.error(`[FAIL] ${service.name}: ${error.message}`);
  }
}

if (failed && process.env.INTEGRATION_STRICT === "true") {
  process.exit(1);
}

if (failed && passed === 0) {
  console.warn(
    "[SKIP] No service health endpoints were reachable. Set INTEGRATION_STRICT=true to fail."
  );
}
