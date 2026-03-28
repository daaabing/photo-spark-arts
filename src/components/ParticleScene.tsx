import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { particleVertexShader, particleFragmentShader } from '@/lib/shaders';
import { ParticleData } from '@/lib/imageProcessor';

interface ParticleSceneProps {
  data: ParticleData | null;
  isExploded: boolean;
}

export default function ParticleScene({ data, isExploded }: ParticleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    material: THREE.ShaderMaterial;
    composer: EffectComposer;
    points: THREE.Points | null;
    geometry: THREE.BufferGeometry | null;
    mousePosition: THREE.Vector3;
    raycaster: THREE.Raycaster;
    interactionPlane: THREE.Plane;
    uProgressValue: number;
    animId: number;
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

  // Init scene once
  useEffect(() => {
    if (!containerRef.current) return;
    cleanup();

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(pixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 40;

    // Bloom post-processing
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      1.6, // strength
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
        uSize: { value: 0.2 * pixelRatio },
        uMouse: { value: new THREE.Vector3(999, 999, 999) },
        uInteractionRadius: { value: 4.0 },
        uRepX: { value: 3.0 },
        uRepY: { value: 3.0 },
        uRepZ: { value: 8.0 },
        uActivity: { value: 1.0 },
        uProgress: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mousePosition = new THREE.Vector3(999, 999, 0);
    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // Pointer events (mouse + touch)
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

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerLeave = () => {
      mousePosition.set(999, 999, 0);
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
      composer.setSize(cw, ch);
      material.uniforms.uSize.value = 0.2 * Math.min(window.devicePixelRatio, 2);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      material.uniforms.uTime.value = elapsed;

      // Smooth mouse interpolation
      const currentMouse = material.uniforms.uMouse.value as THREE.Vector3;
      currentMouse.x += (mousePosition.x - currentMouse.x) * 10 * dt;
      currentMouse.y += (mousePosition.y - currentMouse.y) * 10 * dt;

      controls.update();
      composer.render();
    };
    animId = requestAnimationFrame(animate);

    refs.current = {
      renderer,
      scene,
      camera,
      controls,
      material,
      composer,
      points: null,
      geometry: null,
      mousePosition,
      raycaster,
      interactionPlane,
      uProgressValue: 1.0,
      animId,
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
    if (!refs.current || !data) return;
    const { scene, material } = refs.current;

    if (refs.current.points) {
      scene.remove(refs.current.points);
      refs.current.geometry?.dispose();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(data.targetPos, 3));
    geometry.setAttribute('aRandomPosition', new THREE.BufferAttribute(data.randomPos, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(data.scales, 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(data.targetPos.slice(), 3));

    refs.current.geometry = geometry;
    const points = new THREE.Points(geometry, material);
    refs.current.points = points;
    scene.add(points);

    // Reset progress to trigger assemble animation
    refs.current.uProgressValue = 0;
    material.uniforms.uProgress.value = 0;
  }, [data]);

  // Animate progress for explode/assemble
  useEffect(() => {
    if (!refs.current) return;
    const target = isExploded ? 0.0 : 1.0;
    let animId: number;

    const updateProgress = () => {
      if (!refs.current) return;
      const current = refs.current.uProgressValue;
      const next = current + (target - current) * 0.05;
      refs.current.uProgressValue = next;
      refs.current.material.uniforms.uProgress.value = next;
      if (Math.abs(target - next) > 0.001) {
        animId = requestAnimationFrame(updateProgress);
      } else {
        refs.current.material.uniforms.uProgress.value = target;
        refs.current.uProgressValue = target;
      }
    };
    updateProgress();

    return () => cancelAnimationFrame(animId);
  }, [isExploded, data]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
