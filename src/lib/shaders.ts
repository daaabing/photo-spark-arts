export const vertexShader = `
  attribute vec3 color;
  attribute vec3 originalPosition;
  
  uniform float uTime;
  uniform float uProgress; // 0 = scattered, 1 = formed
  uniform int uMode; // 0 = default, 1 = galaxy, 2 = liquid, 3 = glitch
  uniform vec2 uTouch; // touch position in world space
  uniform float uTouchActive;
  uniform float uPixelRatio;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  // Simplex-like hash
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  
  void main() {
    vColor = color;
    vAlpha = 1.0;
    
    if (position.z < -900.0) {
      gl_Position = vec4(0.0, 0.0, -999.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }
    
    vec3 pos = position;
    float h = hash(originalPosition * 100.0);
    
    // Explosion scatter (when progress < 1)
    if (uProgress < 1.0) {
      vec3 scatterDir = normalize(originalPosition + vec3(h - 0.5, h * 2.0 - 1.0, h * 3.0 - 1.5));
      float scatterDist = 15.0 + h * 20.0;
      vec3 scattered = originalPosition + scatterDir * scatterDist;
      pos = mix(scattered, originalPosition, uProgress);
      // Also mix current animated pos
      pos = mix(pos, position, uProgress);
    }
    
    // Mode effects
    if (uMode == 0) {
      // Default: subtle wave
      pos.z += sin(pos.x * 0.5 + uTime * 0.8) * 0.3 * cos(pos.y * 0.3 + uTime * 0.5);
    } else if (uMode == 1) {
      // Galaxy: spiral rotation
      float dist = length(pos.xy);
      float angle = atan(pos.y, pos.x) + uTime * 0.3 / (dist + 1.0);
      pos.x = cos(angle) * dist;
      pos.y = sin(angle) * dist;
      pos.z += sin(dist * 0.8 - uTime * 2.0) * 0.5;
    } else if (uMode == 2) {
      // Liquid: flowing motion
      pos.x += sin(pos.y * 0.4 + uTime * 0.6) * 0.8;
      pos.y += cos(pos.x * 0.3 + uTime * 0.5) * 0.6;
      pos.z += sin(uTime * 0.4 + pos.x * 0.2 + pos.y * 0.3) * 1.0;
    } else if (uMode == 3) {
      // Glitch: random displacement
      float glitch = step(0.97, sin(uTime * 20.0 + h * 100.0));
      pos.x += glitch * (h - 0.5) * 3.0;
      pos.y += glitch * (fract(h * 7.0) - 0.5) * 3.0;
      // Color glitch
      vColor = mix(color, vec3(h, fract(h * 3.0), fract(h * 7.0)), glitch * 0.8);
    }
    
    // Touch repel
    if (uTouchActive > 0.5) {
      vec2 diff = pos.xy - uTouch;
      float touchDist = length(diff);
      float repelStrength = smoothstep(3.0, 0.0, touchDist) * 2.0;
      pos.xy += normalize(diff + vec2(0.001)) * repelStrength;
      pos.z += repelStrength * 0.5;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float size = 3.0 * uPixelRatio;
    gl_PointSize = size * (8.0 / -mvPosition.z);
    
    // Fade distant particles
    vAlpha = smoothstep(30.0, 5.0, -mvPosition.z);
  }
`;

export const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
    
    // Slight glow
    vec3 col = vColor + vColor * 0.3 * smoothstep(0.5, 0.0, dist);
    
    gl_FragColor = vec4(col, alpha);
  }
`;
