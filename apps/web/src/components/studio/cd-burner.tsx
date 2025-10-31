'use client';

import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { X, Download } from 'lucide-react';

interface CDData {
  soundName: string;
  artistName: string;
  walletAddress: string;
}

interface CDBurnerProps {
  data: CDData;
  onClose: () => void;
}

// Animated Laser Beams
function LaserBeams() {
  const lasersRef = useRef<THREE.Group>(null);
  const numLasers = 8;

  useFrame(({ clock }) => {
    if (lasersRef.current) {
      lasersRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  const lasers = useMemo(() => {
    return Array.from({ length: numLasers }).map((_, i) => {
      const angle = (i / numLasers) * Math.PI * 2;
      const radius = 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const color = new THREE.Color().setHSL(i / numLasers, 1.0, 0.6);
      
      return (
        <group key={i} position={[x, 0, z]}>
          <mesh rotation={[0, -angle, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* Glow effect */}
          <pointLight position={[0, 0, 0]} color={color} intensity={2} distance={2} />
        </group>
      );
    });
  }, [numLasers]);

  return <group ref={lasersRef}>{lasers}</group>;
}

// CD Disk
function CDDisk({ data }: { data: CDData }) {
  const diskRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (diskRef.current) {
      diskRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      diskRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Memoize the rainbow texture to prevent recreation on every render
  const rainbowTexture = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
      gradient.addColorStop(0, '#ff00ff');
      gradient.addColorStop(0.2, '#00ffff');
      gradient.addColorStop(0.4, '#00ff00');
      gradient.addColorStop(0.6, '#ffff00');
      gradient.addColorStop(0.8, '#ff7700');
      gradient.addColorStop(1, '#ff00ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    } catch (error) {
      console.error('Failed to create rainbow texture:', error);
      return null;
    }
  }, []);

  return (
    <group ref={diskRef}>
      {/* Main CD disk */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      >
        <cylinderGeometry args={[1.5, 1.5, 0.1, 64]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Center hole */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.11, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Rainbow reflection ring */}
      {rainbowTexture && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.051, 0]}>
          <ringGeometry args={[0.3, 1.4, 64]} />
          <meshBasicMaterial side={THREE.DoubleSide} map={rainbowTexture} />
        </mesh>
      )}

      {/* Text on CD */}
      <Text
        position={[0, 0.06, 0.7]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {data.soundName}
      </Text>

      <Text
        position={[0, 0.06, 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {data.artistName}
      </Text>

      <Text
        position={[0, 0.06, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {formatAddress(data.walletAddress)}
      </Text>

      {/* Sparkles around the CD */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <pointLight
            key={i}
            position={[x, 0, z]}
            color={new THREE.Color().setHSL(i / 12, 1.0, 0.5)}
            intensity={0.5}
            distance={1}
          />
        );
      })}
    </group>
  );
}

// Main Scene
function CDScene({ data }: { data: CDData }) {
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 5, 15]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
      />

      {/* Environment for reflections - wrapped in Suspense with error handling */}
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* CD and Lasers */}
      <Suspense fallback={null}>
        <CDDisk data={data} />
        <LaserBeams />
      </Suspense>

      {/* Grid floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// Main Component
export function CDBurner({ data, onClose }: CDBurnerProps) {
  const [isBurning, setIsBurning] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = () => {
    try {
      // Capture canvas as image
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${data.soundName}-CD.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    } catch (error) {
      console.error('Failed to download CD image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full h-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-1">
              🔥 {isBurning ? 'Burning to CD...' : 'CD Ready!'}
            </h2>
            <p className="text-sm text-gray-400">
              {isBurning
                ? 'Creating your holographic masterpiece'
                : 'Your audio has been immortalized'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              title="Download CD Image"
            >
              <Download size={18} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/10 transition-colors text-white"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        {!hasError ? (
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            shadows
            gl={{ 
              preserveDrawingBuffer: true,
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance'
            }}
            onCreated={({ gl }) => {
              try {
                // Simulate burning process
                setTimeout(() => setIsBurning(false), 3000);
              } catch (error) {
                console.error('Canvas creation error:', error);
                setHasError(true);
              }
            }}
            onError={(error) => {
              console.error('Three.js error:', error);
              setHasError(true);
            }}
          >
            <CDScene data={data} />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">💿</div>
              <h3 className="text-2xl font-bold text-white mb-2">CD Ready!</h3>
              <p className="text-gray-400 mb-4">
                Your audio has been immortalized
              </p>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4 max-w-md">
                <div className="space-y-2 text-left">
                  <div>
                    <p className="text-xs text-gray-400">Sound</p>
                    <p className="text-sm font-semibold text-white">{data.soundName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Artist</p>
                    <p className="text-sm font-semibold text-white">{data.artistName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Wallet</p>
                    <p className="text-sm font-mono text-white">{data.walletAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Sound</p>
                <p className="text-sm font-semibold text-white truncate">
                  {data.soundName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Artist</p>
                <p className="text-sm font-semibold text-white truncate">
                  {data.artistName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Wallet</p>
                <p className="text-sm font-mono text-white truncate">
                  {data.walletAddress.slice(0, 6)}...{data.walletAddress.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Burning Progress */}
        {isBurning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md border border-primary/30 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-semibold text-lg mb-2">Burning CD...</p>
              <p className="text-gray-400 text-sm">Applying holographic coating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

