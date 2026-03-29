import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { particleVertexShader, particleFragmentShader } from '@/lib/shaders';
import { ParticleData } from '@/lib/imageProcessor';

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
  params: SceneParams;
  isExploded: boolean;
}

export default function ParticleScene({ data, params, isExploded }: ParticleSceneProps) {
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
    clock: THREE.Clock;
  } | null>(null);

  // Init scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
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

    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h), 1.6, 0.4, 0.85
    );
    bloomPass.threshold = 0.05;
    bloomPass.strength = 1.6;
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

    const onMouseMove = (e: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(interactionPlane, pt);
      if (pt) mousePosition.copy(pt);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 1) {
        const touch = e.touches[0];
        const mouse = new THREE.Vector2(
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const pt = new THREE.Vector3();
        raycaster.ray.intersectPlane(interactionPlane, pt);
        if (pt) mousePosition.copy(pt);
      }
    };

    const onResize = () => {
      const cw = container.clientWidth || window.innerWidth;
      const ch = container.clientHeight || window.innerHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
      composer.setSize(cw, ch);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
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
      interactionPlane, uProgressValue: 1.0, clock,
    };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Update geometry when data changes
  useEffect(() => {
    if (!refs.current) return;
    const { scene, material } = refs.current;

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

    // Reset progress for assemble animation
    refs.current.uProgressValue = 0;
    material.uniforms.uProgress.value = 0;
  }, [data]);

  // Animate progress (explode/assemble)
  useEffect(() => {
    if (!refs.current?.material) return;
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

  // Update uniforms reactively
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

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
