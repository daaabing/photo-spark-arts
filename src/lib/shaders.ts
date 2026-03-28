export const particleVertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uMouse;
  uniform float uInteractionRadius;
  uniform float uRepX;
  uniform float uRepY;
  uniform float uRepZ;
  uniform float uActivity;
  uniform float uProgress;
  uniform int uMode;
  uniform float uGravity;

  attribute vec3 aTargetPosition;
  attribute vec3 aRandomPosition;
  attribute vec3 aColor;
  attribute float aScale;

  varying vec3 vColor;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 1e4); }

  void main() {
    vec3 pos = mix(aRandomPosition, aTargetPosition, uProgress);

    float noiseStrength = mix(2.0, 0.2, uProgress) * uActivity;
    if (uProgress < 0.95) {
      pos.x += sin(uTime * 0.5 * uActivity + pos.y) * 0.5 * uActivity;
      pos.y += cos(uTime * 0.3 * uActivity + pos.x) * 0.5 * uActivity;
    } else {
      // Mode effects (applied after assembled)
      if (uMode == 0) {
        // Galaxy: spiral rotation
        float dist = length(pos.xy);
        float angle = atan(pos.y, pos.x) + uTime * 0.3 * uGravity / (dist + 1.0);
        float newDist = dist;
        pos.x = cos(angle) * newDist;
        pos.y = sin(angle) * newDist;
        pos.z += sin(dist * 0.8 - uTime * 2.0) * 0.3 * uGravity;
      } else if (uMode == 1) {
        // Liquid: flowing motion
        pos.x += sin(pos.y * 0.4 + uTime * 0.6) * 0.5 * uGravity;
        pos.y += cos(pos.x * 0.3 + uTime * 0.5) * 0.4 * uGravity;
        pos.z += sin(uTime * 0.4 + pos.x * 0.2 + pos.y * 0.3) * 0.6 * uGravity;
      } else if (uMode == 2) {
        // Glitch: random displacement
        float h = hash(pos.x * 100.0 + pos.y * 37.0);
        float glitch = step(0.97, sin(uTime * 20.0 + h * 100.0));
        pos.x += glitch * (h - 0.5) * 2.0 * uGravity;
        pos.y += glitch * (fract(h * 7.0) - 0.5) * 2.0 * uGravity;
      }
    }

    // Mouse/touch repulsion
    float distToMouse = distance(pos.xy, uMouse.xy);
    if (distToMouse < uInteractionRadius) {
      vec3 dir = normalize(pos - uMouse);
      float force = (uInteractionRadius - distToMouse) / uInteractionRadius;
      force = pow(force, 2.0);
      pos.x += dir.x * force * uRepX;
      pos.y += dir.y * force * uRepY;
      pos.z += force * uRepZ;
    }

    vColor = aColor;
    vAlpha = mix(0.6, 1.0, uProgress);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * aScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float strength = 1.0 - smoothstep(0.3, 0.5, dist);
    gl_FragColor = vec4(vColor, strength * vAlpha);
  }
`;
