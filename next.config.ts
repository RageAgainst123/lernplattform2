import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workspace-Root explizit fixieren — sonst rät Next.js wegen einer
  // package-lock.json im User-Home die falsche Root (Turbopack-Warnung).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
