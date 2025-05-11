/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'myaisitebuilder.s3-website.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'myaisitebuilder.s3.us-east-2.amazonaws.com',
      }
    ],
  },
  // Ensure the local-storage directory is accessible
  async rewrites() {
    return [
      {
        source: '/local-storage/:path*',
        destination: '/public/local-storage/:path*',
      },
    ];
  }
}

module.exports = nextConfig 