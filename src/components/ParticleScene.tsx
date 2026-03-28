import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleData } from '@/lib/imageProcessor';
import { vertexShader, fragmentShader } from '@/lib/shaders';

export type VisualMode = 'default' | 'galaxy' | 'liquid' | 'glitch';

const MODE_MAP: Record<VisualMode, number> = {
  default: 0,
  galaxy: 1,
  liquid: 2,
  glitch: 3,
};

interface ParticleSceneProps {
  data: ParticleData;
  mode: VisualMode;
}

export default function ParticleScene({ data, mode }: ParticleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    material: THREE.ShaderMaterial;
    animId: number;
    startTime: number;
  } | null>(null);

  const cleanup = useCallback(() => {
    if (sceneRef.current) {
      cancelAnimationFrame(sceneRef.current.animId);
      sceneRef.current.controls.dispose();
      sceneRef.current.renderer.dispose();
      sceneRef.current.renderer.domElement.remove();
      sceneRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    cleanup();

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 12);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 25;

    // Build geometry
    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(data.positions.slice(), 3);
    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(data.originalPositions, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMode: { value: MODE_MAP[mode] },
        uTouch: { value: new THREE.Vector2(0, 0) },
        uTouchActive: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const startTime = performance.now();

    // Touch handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      if (pt) {
        material.uniforms.uTouch.value.set(pt.x, pt.y);
        material.uniforms.uTouchActive.value = 1;
      }
    };

    const onPointerUp = () => {
      material.uniforms.uTouchActive.value = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (material.uniforms.uTouchActive.value < 0.5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      if (pt) {
        material.uniforms.uTouch.value.set(pt.x, pt.y);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Resize
    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener('resize', onResize);

    // Animation
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      material.uniforms.uTime.value = elapsed;
      // Ease in progress over 2 seconds
      material.uniforms.uProgress.value = Math.min(1, elapsed / 2);

      controls.update();
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    sceneRef.current = { renderer, scene, camera, controls, material, animId, startTime };

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      cleanup();
    };
  }, [data, cleanup]);

  // Update mode without re-creating scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.material.uniforms.uMode.value = MODE_MAP[mode];
    }
  }, [mode]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
