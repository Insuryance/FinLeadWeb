/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
async rewrites() {
  return [
    {
      source: "/",
      has: [{ type: "host", value: "insightdashboard.finlead.ai" }],
      destination: "/insight/india",
    },
  ];
},
