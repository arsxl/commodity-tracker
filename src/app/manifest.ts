import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Commodity Tracker',
    short_name: 'CommodityTracker',
    description: 'Live Digital Asset Portfolio Tracker with real-time valuations natively in AED.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
