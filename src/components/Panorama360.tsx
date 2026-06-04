'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface Panorama360Props {
  /** Equirectangular image (2:1, e.g. 8000×4000) served from /public. */
  src: string;
  /** Called when the user clicks the close button. If omitted, no close button is shown. */
  onClose?: () => void;
  /** Auto-rotate on mount. Default: true. */
  autoRotate?: boolean;
  /** Extra classes for the root element. */
  className?: string;
}

const SPHERE_RADIUS = 500;
const MIN_FOV = 30;
const MAX_FOV = 100;
const DEFAULT_FOV = 75;
const DRAG_SPEED = 0.15;
const AUTOROTATE_SPEED = 0.02; // deg per frame

export default function Panorama360({
  src,
  onClose,
  autoRotate = true,
  className,
}: Panorama360Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const frameRef = useRef<number>(0);

  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const prevPinchRef = useRef<number | null>(null);
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const fovRef = useRef(DEFAULT_FOV);
  const autoRotateRef = useRef(autoRotate);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotate);

  useEffect(() => {
    autoRotateRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      DEFAULT_FOV,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 60, 40);
    geometry.scale(-1, 1, 1);

    const placeholder = new THREE.MeshBasicMaterial({ color: 0x101014 });
    const mesh = new THREE.Mesh(geometry, placeholder);
    meshRef.current = mesh;
    scene.add(mesh);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      camera.position.set(0, 0, 0);

      if (autoRotateRef.current) {
        lonRef.current += AUTOROTATE_SPEED;
      }

      const lat = Math.max(-85, Math.min(85, latRef.current));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lonRef.current);
      camera.lookAt(
        SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
        SPHERE_RADIUS * Math.cos(phi),
        SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
      );

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);

      if (materialRef.current) {
        materialRef.current.map?.dispose();
        materialRef.current.dispose();
        materialRef.current = null;
      }
      placeholder.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      cameraRef.current = null;
      meshRef.current = null;
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const loader = new THREE.TextureLoader();
    let cancelled = false;

    loader.load(
      src,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;

        materialRef.current?.map?.dispose();
        materialRef.current?.dispose();

        const material = new THREE.MeshBasicMaterial({ map: texture });
        materialRef.current = material;
        if (meshRef.current) meshRef.current.material = material;

        setIsLoading(false);
      },
      undefined,
      () => {
        if (cancelled) return;
        setHasError(true);
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [src]);

  const onPointerDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    lonRef.current -= (e.clientX - prevPointerRef.current.x) * DRAG_SPEED;
    latRef.current += (e.clientY - prevPointerRef.current.y) * DRAG_SPEED;
    latRef.current = Math.max(-85, Math.min(85, latRef.current));
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    fovRef.current = Math.max(MIN_FOV, Math.min(MAX_FOV, fovRef.current + e.deltaY * 0.05));
    if (cameraRef.current) {
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevPinchRef.current = null;
      prevPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      prevPinchRef.current = Math.hypot(dx, dy);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (prevPinchRef.current !== null) {
        const delta = prevPinchRef.current - dist;
        fovRef.current = Math.max(MIN_FOV, Math.min(MAX_FOV, fovRef.current + delta * 0.1));
        if (cameraRef.current) {
          cameraRef.current.fov = fovRef.current;
          cameraRef.current.updateProjectionMatrix();
        }
      }
      prevPinchRef.current = dist;
      return;
    }
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    lonRef.current -= (e.touches[0].clientX - prevPointerRef.current.x) * DRAG_SPEED;
    latRef.current += (e.touches[0].clientY - prevPointerRef.current.y) * DRAG_SPEED;
    latRef.current = Math.max(-85, Math.min(85, latRef.current));
    prevPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    prevPinchRef.current = null;
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#101014',
        touchAction: 'none',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab',
      }}
    >
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {isLoading && !hasError && (
        <div style={overlayStyle}>
          <div style={spinnerStyle} />
          <style>{'@keyframes p360spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}

      {hasError && (
        <div style={{ ...overlayStyle, color: '#fff', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
          Falha ao carregar a imagem 360°.
        </div>
      )}

      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 20 }}>
        <button
          type="button"
          aria-label={isRotating ? 'Pausar rotação' : 'Retomar rotação'}
          onClick={() => setIsRotating((v) => !v)}
          style={buttonStyle}
        >
          {isRotating ? <PauseIcon /> : <PlayIcon />}
        </button>

        {onClose && (
          <button type="button" aria-label="Fechar" onClick={onClose} style={buttonStyle}>
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 15,
  pointerEvents: 'none',
};

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid rgba(255,255,255,0.25)',
  borderTopColor: '#fff',
  animation: 'p360spin 0.8s linear infinite',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
};

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
