/** @type {import('next').NextConfig} */
const nextConfig = {
  // any of your existing Next.js options go here…

  webpack(config, { isServer }) {
    if (isServer) {
      // Make sure config.externals is always an array
      const externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals];

      config.externals = [
        ...externals,
        // Prevent bundling chrome-aws-lambda—let require() load it at runtime
        'chrome-aws-lambda',
      ];
    }

    return config;
  },
};

module.exports = {
  typescript: {
    ignoreBuildErrors: true, // ⛔ ignoriert TS-Fehler
  },
  eslint: {
    ignoreDuringBuilds: true, // ⛔ ignoriert ESLint-Fehler
  },
};