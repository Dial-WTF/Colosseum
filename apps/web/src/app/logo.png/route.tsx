import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          borderRadius: '20%',
          position: 'relative',
        }}
      >
        {/* Liquid glass overlay effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
            borderRadius: '20%',
            display: 'flex',
          }}
        />
        
        {/* Inner glow */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            right: '10%',
            bottom: '10%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
            borderRadius: '20%',
            display: 'flex',
          }}
        />

        {/* Glassmorphic container with phone emoji */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 184,
            fontWeight: 900,
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            background: 'rgba(255,255,255,0.15)',
            width: '70%',
            height: '70%',
            borderRadius: '16%',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          📞
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}

