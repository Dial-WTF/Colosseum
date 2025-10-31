'use client';

import { useEffect, useRef } from 'react';

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vaporwave grid animation
    let animationFrame: number;
    let offset = 0;

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create enhanced gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
      gradient.addColorStop(0.5, 'rgba(255, 20, 147, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Enhanced perspective grid with better 3D effect
      const gridSize = 50;
      const horizon = canvas.height / 2;
      const vanishingPointY = horizon + offset;
      
      // Draw horizontal lines (with proper perspective)
      for (let y = 0; y < 20; y++) {
        const yPos = vanishingPointY + (y * gridSize);
        
        // Skip if line is above horizon
        if (yPos < horizon) continue;
        
        // Calculate perspective scale based on distance from horizon
        const distanceFromHorizon = yPos - horizon;
        const scale = Math.min(distanceFromHorizon / 200, 3);
        const lineWidth = canvas.width * scale;
        
        // Fade lines based on distance
        const alpha = Math.max(0.2, Math.min(0.6, 1 - (y / 25)));
        ctx.strokeStyle = `rgba(255, 20, 147, ${alpha})`;
        ctx.lineWidth = Math.max(1, 3 - y * 0.1);
        
        ctx.beginPath();
        ctx.moveTo(Math.max(0, canvas.width / 2 - lineWidth / 2), yPos);
        ctx.lineTo(Math.min(canvas.width, canvas.width / 2 + lineWidth / 2), yPos);
        ctx.stroke();
      }

      // Draw vertical lines (converging to center)
      const numVerticalLines = 20;
      for (let i = -numVerticalLines; i <= numVerticalLines; i++) {
        if (i === 0) continue; // Skip center line
        
        const xOffset = i * (canvas.width / numVerticalLines / 2);
        const startX = canvas.width / 2 + xOffset;
        const endX = canvas.width / 2 + (xOffset * 3);
        
        const alpha = Math.max(0.2, Math.min(0.5, 1 - Math.abs(i) / numVerticalLines));
        ctx.strokeStyle = `rgba(255, 20, 147, ${alpha})`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, vanishingPointY);
        ctx.lineTo(endX, canvas.height + 100);
        ctx.stroke();
      }

      // Animate the offset
      offset += 2;
      if (offset > gridSize) {
        offset = 0;
      }

      animationFrame = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className="relative min-h-screen">
      {/* Vaporwave Grid Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10"
        style={{ background: 'radial-gradient(circle at center, #0a0a0a 0%, #1a0a2e 100%)' }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Ridiculous Header */}
          <div className="space-y-6 animate-pulse-slow">
            <div className="text-7xl md:text-9xl font-black tracking-tighter">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient">
                DIAL.WTF
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              MINT CUSTOM <span className="text-pink-500 animate-bounce inline-block">RINGTONES</span> 📱
            </h1>

            <p className="text-2xl md:text-4xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">STICKERS</span>{' '}
              <span className="text-4xl">🎨</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">• NFT PACKS</span>{' '}
              <span className="text-4xl">🎁</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">• MAKE BANK</span>{' '}
              <span className="text-4xl">💰</span>
            </p>

            <div className="text-xl md:text-2xl text-cyan-400 font-semibold space-y-2">
              <p className="animate-bounce">🚀 POWERED BY SOLANA</p>
              <p className="text-pink-500">LIMITED MASTER EDITIONS • BONDING CURVES • TO THE MOON</p>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative max-w-sm mx-auto animate-float">
            <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 p-1 rounded-[3rem] shadow-2xl shadow-pink-500/50">
              <div className="bg-black rounded-[2.8rem] p-4 relative overflow-hidden">
                {/* Phone Notch */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-20"></div>
                
                {/* Phone Screen Content */}
                <div className="relative h-[600px] bg-gradient-to-br from-black via-purple-900/50 to-black rounded-[2rem] overflow-hidden">
                  {/* App Interface Mock */}
                  <div className="p-6 space-y-4 text-left">
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
                        DIAL 📞
                      </div>
                      
                      {/* Ringtone Examples */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur border border-pink-500/50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">🔊 DEGEN ANTHEM</span>
                            <span className="text-cyan-400 font-bold">0.1 SOL</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur border border-cyan-500/50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">🎵 MOON CALL</span>
                            <span className="text-pink-400 font-bold">0.2 SOL</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-500/20 to-pink-500/20 backdrop-blur border border-yellow-500/50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">💎 DIAMOND RING</span>
                            <span className="text-yellow-400 font-bold">0.5 SOL</span>
                          </div>
                        </div>
                      </div>

                      {/* Sticker Pack Preview */}
                      <div className="bg-gradient-to-r from-cyan-500/20 to-pink-500/20 backdrop-blur border border-cyan-500/50 rounded-xl p-4">
                        <div className="text-white font-bold mb-2">🎨 STICKER PACK #1</div>
                        <div className="text-4xl space-x-2">
                          😂🚀💎🔥💰🎉
                        </div>
                      </div>

                      {/* CTA */}
                      <button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-black py-4 rounded-xl text-lg animate-pulse">
                        MINT NOW 🔥
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Emojis */}
            <div className="absolute -top-10 -left-10 text-6xl animate-spin-slow">💎</div>
            <div className="absolute -top-10 -right-10 text-6xl animate-bounce">🚀</div>
            <div className="absolute -bottom-10 -left-10 text-6xl animate-pulse">💰</div>
            <div className="absolute -bottom-10 -right-10 text-6xl animate-spin-slow">🔥</div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-6 pt-8">
            <a
              href="/dashboard/studio"
              className="px-12 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white text-xl font-black rounded-2xl hover:scale-110 transition-transform shadow-2xl shadow-pink-500/50 animate-pulse"
            >
              🎨 START CREATING
            </a>
            <a
              href="/marketplace"
              className="px-12 py-5 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 text-white text-xl font-black rounded-2xl hover:scale-110 transition-transform shadow-2xl shadow-yellow-500/50"
            >
              💰 MAKE MONEY NOW
            </a>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <div className="px-6 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur border border-pink-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">📞</span>
              CUSTOM RINGTONES
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur border border-cyan-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">😂</span>
              EMOJI STICKERS
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 backdrop-blur border border-cyan-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">🎁</span>
              NFT PACKS
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 backdrop-blur border border-yellow-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">💰</span>
              EARN ROYALTIES
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur border border-pink-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">📈</span>
              BONDING CURVES
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur border border-cyan-500/50 rounded-full text-white font-bold">
              <span className="text-2xl mr-2">⚡</span>
              INSTANT TRADING
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid md:grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur border border-pink-500/30 rounded-2xl p-6">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                10K+
              </div>
              <div className="text-white font-bold mt-2">RINGTONES MINTED 🔊</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur border border-cyan-500/30 rounded-2xl p-6">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
                50K+
              </div>
              <div className="text-white font-bold mt-2">STICKERS CREATED 🎨</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-pink-500/10 backdrop-blur border border-yellow-500/30 rounded-2xl p-6">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-pink-500">
                1M+
              </div>
              <div className="text-white font-bold mt-2">SOL TRADED 💰</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
}

