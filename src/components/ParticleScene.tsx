import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { particleVertexShader, particleFragmentShader } from '@/lib/shaders';
import { ParticleData } from '@/lib/imageProcessor';

export type VisualMode = 'galaxy' | 'liquid' | 'glitch';

const MODE_MAP: Record<VisualMode, number> = {
  galaxy: 0,
  liquid: 1,
  glitch: 2,
};

export interface SceneParams {
  size: number;
  brightness: number;
  repX: number;
  repY: number;
  repZ: number;
  activity: number;
}

interface ParticleSceneProps {
  data: ParticleData | null;
  mode: VisualMode;
  gravity: number;
  params: SceneParams;
}

export default function ParticleScene({ data, mode, gravity, params }: ParticleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    material: THREE.ShaderMaterial;
    composer: EffectComposer;
    bloomPass: UnrealBloomPass;
    points: THREE.Points | null;
    geometry: THREE.BufferGeometry | null;
    mousePosition: THREE.Vector3;
    raycaster: THREE.Raycaster;
    interactionPlane: THREE.Plane;
    uProgressValue: number;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  const cleanup = useCallback(() => {
    if (refs.current) {
      cancelAnimationFrame(refs.current.animId);
      refs.current.controls.dispose();
      refs.current.renderer.dispose();
      refs.current.renderer.domElement.remove();
      if (refs.current.geometry) refs.current.geometry.dispose();
      refs.current = null;
    }
  }, []);

  // Init scene
  useEffect(() => {
    if (!containerRef.current) return;
    cleanup();

    const container = containerRef.current;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x101010, 1);
    renderer.setSize(w, h);
    renderer.setPixelRatio(pixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 40;

    // Bloom
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      params.brightness,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.05;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: params.size * pixelRatio },
        uMouse: { value: new THREE.Vector3(999, 999, 999) },
        uInteractionRadius: { value: 4.0 },
        uRepX: { value: params.repX },
        uRepY: { value: params.repY },
        uRepZ: { value: params.repZ },
        uActivity: { value: params.activity },
        uProgress: { value: 1.0 },
        uMode: { value: MODE_MAP[mode] },
        uGravity: { value: gravity },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mousePosition = new THREE.Vector3(999, 999, 0);
    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(interactionPlane, pt);
      if (pt) mousePosition.copy(pt);
    };

    const onPointerMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onPointerLeave = () => mousePosition.set(999, 999, 0);

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      const cw = container.clientWidth || 400;
      const ch = container.clientHeight || 400;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
      composer.setSize(cw, ch);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;
      const currentMouse = material.uniforms.uMouse.value as THREE.Vector3;
      currentMouse.x += (mousePosition.x - currentMouse.x) * 10 * dt;
      currentMouse.y += (mousePosition.y - currentMouse.y) * 10 * dt;
      controls.update();
      composer.render();
    };
    animId = requestAnimationFrame(animate);

    refs.current = {
      renderer, scene, camera, controls, material, composer, bloomPass,
      points: null, geometry: null, mousePosition, raycaster,
      interactionPlane, uProgressValue: 1.0, animId, clock,
    };

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      cleanup();
    };
  }, [cleanup]);

  // Update geometry when data changes
  useEffect(() => {
    if (!refs.current) return;
    const { scene, material } = refs.current;

    // Remove old
    if (refs.current.points) {
      scene.remove(refs.current.points);
      refs.current.geometry?.dispose();
      refs.current.points = null;
      refs.current.geometry = null;
    }

    if (!data || data.count === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('aTargetPosition', new THREE.Float32BufferAttribute(data.targetPos, 3));
    geometry.setAttribute('aRandomPosition', new THREE.Float32BufferAttribute(data.randomPos, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setAttribute('aScale', new THREE.Float32BufferAttribute(data.scales, 1));
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(data.targetPos), 3));

    refs.current.geometry = geometry;
    const points = new THREE.Points(geometry, material);
    refs.current.points = points;
    scene.add(points);

    // Trigger assemble animation
    refs.current.uProgressValue = 0;
    material.uniforms.uProgress.value = 0;
  }, [data]);

  // Animate progress (assemble)
  useEffect(() => {
    if (!refs.current) return;
    let animId: number;
    const updateProgress = () => {
      if (!refs.current) return;
      const current = refs.current.uProgressValue;
      const next = current + (1.0 - current) * 0.05;
      refs.current.uProgressValue = next;
      refs.current.material.uniforms.uProgress.value = next;
      if (Math.abs(1.0 - next) > 0.001) {
        animId = requestAnimationFrame(updateProgress);
      } else {
        refs.current.material.uniforms.uProgress.value = 1.0;
        refs.current.uProgressValue = 1.0;
      }
    };
    updateProgress();
    return () => cancelAnimationFrame(animId);
  }, [data]);

  // Update uniforms reactively
  useEffect(() => {
    if (!refs.current) return;
    refs.current.material.uniforms.uMode.value = MODE_MAP[mode];
  }, [mode]);

  useEffect(() => {
    if (!refs.current) return;
    refs.current.material.uniforms.uGravity.value = gravity;
  }, [gravity]);

  useEffect(() => {
    if (!refs.current?.material || !refs.current?.bloomPass) return;
    const pr = Math.min(window.devicePixelRatio, 2);
    refs.current.material.uniforms.uSize.value = params.size * pr;
    refs.current.material.uniforms.uRepX.value = params.repX;
    refs.current.material.uniforms.uRepY.value = params.repY;
    refs.current.material.uniforms.uRepZ.value = params.repZ;
    refs.current.material.uniforms.uActivity.value = params.activity;
    refs.current.bloomPass.strength = params.brightness;
  }, [params]);

  return <div ref={containerRef} className="w-full h-full" style={{ position: 'relative' }} />;
}
