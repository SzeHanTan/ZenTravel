/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Required: Tells Next.js to generate static HTML/CSS/JS
  images: {
    unoptimized: true, // Required: Native apps can't use Next.js's image optimization service
  },
};

export default nextConfig;
