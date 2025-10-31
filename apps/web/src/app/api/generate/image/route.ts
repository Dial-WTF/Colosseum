import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
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

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
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

    // Using SDXL for image generation
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: 'blurry, low quality, distorted, watermark, text',
          width: 1024,
          height: 1024,
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
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

