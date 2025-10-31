import { NextResponse } from 'next/server';

export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.4);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glowGradient" cx="30%" cy="30%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
      <stop offset="60%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="512" height="512" rx="102.4" fill="url(#bgGradient)"/>
  
  <!-- Glass overlay effect -->
  <rect width="512" height="512" rx="102.4" fill="url(#glassGradient)"/>
  
  <!-- Inner glow -->
  <rect x="51.2" y="51.2" width="409.6" height="409.6" rx="81.92" fill="url(#glowGradient)"/>
  
  <!-- Glassmorphic container -->
  <rect x="76.8" y="76.8" width="358.4" height="358.4" rx="40.96" 
        fill="rgba(255,255,255,0.15)" 
        stroke="rgba(255,255,255,0.3)" 
        stroke-width="2.56"/>
  
  <!-- Phone emoji -->
  <text x="256" y="340" 
        font-size="200" 
        text-anchor="middle" 
        dominant-baseline="middle"
        filter="drop-shadow(0px 4px 16px rgba(0,0,0,0.3))">📞</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

