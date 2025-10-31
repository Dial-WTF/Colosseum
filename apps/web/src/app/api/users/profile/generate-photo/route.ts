/**
 * AI Profile Photo Generation API
 * Uses Replicate to generate profile photos
 */

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

/**
 * POST /api/users/profile/generate-photo
 * Generate an AI profile photo
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'avatar' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    // Style presets for profile photos
    const stylePrompts: Record<string, string> = {
      avatar: 'professional avatar, clean background, centered portrait, high quality',
      artistic: 'artistic portrait, creative style, vibrant colors, unique aesthetic',
      anime: 'anime style avatar, expressive eyes, clean lines, vibrant colors',
      pixel: '8-bit pixel art avatar, retro gaming style, clear features',
      cyberpunk: 'cyberpunk style portrait, neon colors, futuristic aesthetic',
      cartoon: 'cartoon style portrait, friendly expression, bold colors',
    };

    const fullPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.avatar}`;

    // Using SDXL for image generation
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: 'blurry, low quality, distorted, watermark, text, multiple people, cropped',
          width: 512,
          height: 512,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }
    ) as string[];

    if (!output || output.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: output[0],
      prompt: fullPrompt,
    });
  } catch (error: any) {
    console.error('Photo generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate photo' },
      { status: 500 }
    );
  }
}

