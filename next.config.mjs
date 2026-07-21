/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "insightdashboard.finlead.ai" }],
          destination: "/insight/india",
        },
      ],
    };
  },
};

export default nextConfig;
