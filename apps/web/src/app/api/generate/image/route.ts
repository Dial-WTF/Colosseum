import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import * as fal from '@fal-ai/serverless-client';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

// Configure FAL.ai client
fal.config({
  credentials: process.env.FAL_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'meme' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Style presets for different types of stickers
    const stylePrompts: Record<string, string> = {
      meme: 'internet meme style, bold colors, high contrast, simple cartoon style',
      sticker: 'die cut sticker style, white border, clean edges, transparent background',
      pepe: 'pepe the frog style, green frog character, expressive emotions',
      wojak: 'wojak meme character style, simple line art, expressive face',
      anime: 'anime style sticker, vibrant colors, cute chibi aesthetic',
    };

    const fullPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.sticker}`;
    const negativePrompt = 'blurry, low quality, distorted, watermark, text';

    // Try Replicate first if configured
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        console.log('🔷 Attempting image generation with Replicate...');
        const output = await replicate.run(
          'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          {
            input: {
              prompt: fullPrompt,
              negative_prompt: negativePrompt,
              width: 1024,
              height: 1024,
              num_outputs: 1,
              guidance_scale: 7.5,
              num_inference_steps: 50,
            },
          }
        ) as string[];

        if (output && output.length > 0) {
          console.log('✅ Replicate generation successful');
          return NextResponse.json({
            imageUrl: output[0],
            prompt: fullPrompt,
            provider: 'replicate',
          });
        }
      } catch (replicateError: any) {
        console.warn('⚠️ Replicate failed, falling back to FAL.ai:', replicateError.message);
      }
    }

    // Fall back to FAL.ai
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: 'No AI image generation service configured. Please set REPLICATE_API_TOKEN or FAL_KEY.' },
        { status: 500 }
      );
    }

    console.log('🟢 Using FAL.ai for image generation...');
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('FAL.ai progress:', update.logs?.map(log => log.message).join('\n'));
        }
      },
    }) as any;

    if (!result.data?.images?.[0]?.url) {
      return NextResponse.json(
        { error: 'Failed to generate image with FAL.ai' },
        { status: 500 }
      );
    }

    console.log('✅ FAL.ai generation successful');
    return NextResponse.json({
      imageUrl: result.data.images[0].url,
      prompt: fullPrompt,
      provider: 'fal',
    });
  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

