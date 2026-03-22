/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 💡 必须开启静态导出
  images: { unoptimized: true }, // Tauri 不支持 Next.js 默认图片优化
}
module.exports = nextConfig