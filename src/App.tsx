import React, { useState, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Define types for component props
interface ModelProps {
  color: string;
  texture: TextureType;
}

type TextureType = 'none' | 'checkered' | 'striped';

// --- Helper function to create procedural textures ---
// This function now uses RGBAFormat for better compatibility with modern three.js versions.
const createTexture = (type: TextureType): THREE.DataTexture | null => {
  if (type === 'none') return null;

  const width = 64;
  const height = 64;
  const size = width * height;
  const data = new Uint8Array(4 * size); // 4 components: R, G, B, A

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    const x = i % width;
    const y = Math.floor(i / width);
    let color: number;

    if (type === 'checkered') {
      const isWhite = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      color = isWhite ? 255 : 100;
    } else { // 'striped'
      const isWhite = Math.floor(y / 8) % 2 === 0;
      color = isWhite ? 255 : 100;
    }
    
    data[stride] = color;     // R
    data[stride + 1] = color; // G
    data[stride + 2] = color; // B
    data[stride + 3] = 255;   // A (fully opaque)
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true; // Important: tells three.js to update the texture
  return texture;
};


// --- Main App Component ---
export default function App() {
  // State management with TypeScript types
  const [color, setColor] = useState<string>('#ffffff');
  const [texture, setTexture] = useState<TextureType>('none');
  
  const presetColors: string[] = ['#ffffff', '#ff6347', '#4682b4', '#32cd32', '#ffd700', '#6a5acd', '#ee82ee'];
  const textureOptions: TextureType[] = ['none', 'checkered', 'striped'];

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col lg:flex-row font-sans">
      {/* 3D Viewer Canvas */}
      <div className="flex-grow h-full w-full lg:w-3/4 relative">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <Suspense fallback={<CanvasLoader />}>
            {/* Lighting and Environment */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="city" />

            {/* 3D Model */}
            <Model color={color} texture={texture} />

            {/* Controls */}
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-1/4 bg-gray-800 p-6 shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2">3D Product Viewer</h1>
        <p className="text-gray-400 mb-6 text-sm">Built with React, TypeScript, and Three.js.</p>
        
        <div className="space-y-6">
          {/* Color Controls */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Material Color</h2>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setColor(preset)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 ${color === preset ? 'border-blue-400 scale-110' : 'border-gray-600'}`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Set color to ${preset}`}
                />
              ))}
            </div>
            <div className="mt-4">
              <label htmlFor="customColor" className="block text-sm font-medium text-gray-300">Custom</label>
              <input
                id="customColor"
                type="color"
                value={color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                className="w-full h-10 p-1 mt-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Texture Controls */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Texture</h2>
            <div className="grid grid-cols-3 gap-2">
              {textureOptions.map((tex) => (
                <button
                  key={tex}
                  onClick={() => setTexture(tex)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${texture === tex ? 'bg-blue-600 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {tex.charAt(0).toUpperCase() + tex.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
         <p className="text-gray-500 mt-8 text-xs text-center">Interact with the model by dragging to rotate, scrolling to zoom, and right-clicking to pan.</p>
      </div>
    </div>
  );
}

// --- 3D Model Component ---
function Model({ color, texture }: ModelProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Memoize the texture to avoid recreating it on every render
  const proceduralTexture = useMemo(() => createTexture(texture), [texture]);

  useFrame((state, delta) => {
    // Subtle rotation for visual interest
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color} 
        map={proceduralTexture}
        roughness={0.4} 
        metalness={0.1} 
      />
    </mesh>
  );
}

// --- Loader Component ---
// This now correctly uses the <Html> component from drei to display
// HTML content inside the canvas.
function CanvasLoader() {
  return (
    <Html center>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400 mx-auto"></div>
        <p className="mt-4 text-lg text-white">Loading Scene...</p>
      </div>
    </Html>
  );
}
