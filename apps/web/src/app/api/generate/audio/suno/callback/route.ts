import { NextRequest, NextResponse } from 'next/server';

/**
 * Suno API webhook callback endpoint
 * Receives notifications when audio generation is complete
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🎵 Suno callback received:', {
      id: data.id,
      status: data.status,
      hasAudio: !!data.audio_url,
      timestamp: new Date().toISOString(),
    });

    // Log the full callback data for debugging
    console.log('🎵 Full callback data:', JSON.stringify(data, null, 2));

    // In a production app, you might want to:
    // 1. Store the result in a database
    // 2. Notify the client via WebSocket or SSE
    // 3. Update a cache with the audio URL
    
    // For now, we're just logging the callback
    // The polling mechanism in the main route will handle fetching the audio

    return NextResponse.json({ 
      received: true,
      message: 'Callback processed successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error processing Suno callback:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Suno callback endpoint is ready',
    timestamp: new Date().toISOString() 
  });
}

