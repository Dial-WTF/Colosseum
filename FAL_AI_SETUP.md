# FAL.ai Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Account & Get API Key

1. Go to [fal.ai](https://fal.ai/)
2. Click **Sign Up** (you can use GitHub OAuth for instant access)
3. Navigate to [Dashboard → API Keys](https://fal.ai/dashboard/keys)
4. Click **Create New Key**
5. Copy your API key

### 2. Add to Environment Variables

Add to your `.env.local` file:

```bash
FAL_KEY=your_fal_key_here
```

### 3. Add Credits

1. Go to [Billing](https://fal.ai/dashboard/billing)
2. Click **Add Credits**
3. Add $5 (gets you 1,000+ images!)

## 💰 Pricing Comparison

| Service | Cost per Image | Your $5 Gets |
|---------|----------------|--------------|
| **FAL.ai** (Flux Schnell) | ~$0.003 | **~1,666 images** |
| Replicate (SDXL) | ~$0.042 | ~120 images |

**FAL.ai is ~14x cheaper!** 🎉

## 🔧 How It Works

Your app now has **smart fallback logic**:

1. ✅ **Primary**: Tries Replicate first (if `REPLICATE_API_TOKEN` is set)
2. 🔄 **Fallback**: Falls back to FAL.ai (if Replicate fails or isn't configured)
3. ⚡ **Fast**: FAL.ai uses Flux Schnell (4 inference steps = 5-10 seconds)

## 🎨 Models Used

- **FAL.ai**: `fal-ai/flux/schnell` (fast, cheap, high quality)
- **Replicate**: `stability-ai/sdxl` (slower, more expensive, excellent quality)

## 📝 Console Logs

When generating images, you'll see:
- `🔷 Attempting image generation with Replicate...` (if Replicate is configured)
- `⚠️ Replicate failed, falling back to FAL.ai:` (if Replicate fails)
- `🟢 Using FAL.ai for image generation...` (when using FAL.ai)
- `✅ Replicate/FAL.ai generation successful` (on success)

## 🧪 Testing

After setup, test by:
1. Going to your profile page
2. Clicking **Generate Profile Photo**
3. Enter a prompt and generate
4. Check the browser console for which service was used

## 🔐 Environment Variables

Your `.env.local` should have:

```bash
# Primary (optional - will fall back to FAL if not set)
REPLICATE_API_TOKEN=your_replicate_token_here

# Fallback (required if Replicate isn't set)
FAL_KEY=your_fal_key_here
```

## 💡 Pro Tips

1. **Start with FAL.ai only** - Remove `REPLICATE_API_TOKEN` to save money
2. **Monitor usage** - Check [FAL.ai dashboard](https://fal.ai/dashboard) for usage stats
3. **Adjust quality** - Edit `num_inference_steps` in the API routes:
   - `4` = fastest, cheapest (~$0.003)
   - `20` = slower, better quality (~$0.015)
4. **Try other models** - FAL.ai has many models:
   - `fal-ai/flux/dev` - Better quality, slightly more expensive
   - `fal-ai/flux/pro` - Best quality, more expensive ($0.05/image)

## 📚 Additional Resources

- [FAL.ai Docs](https://fal.ai/docs)
- [FAL.ai Pricing](https://fal.ai/pricing)
- [FAL.ai Model Gallery](https://fal.ai/models)

---

**Ready to generate!** 🎉

