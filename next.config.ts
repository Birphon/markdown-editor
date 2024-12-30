/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static HTML export
  images: {
    unoptimized: true  // Required for static export
  },
  basePath: process.env.NODE_ENV === 'production' ? '/markdown-editor' : '',  // Replace with your repository name
}

module.exports = nextConfig