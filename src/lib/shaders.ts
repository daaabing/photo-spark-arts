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

  attribute vec3 aTargetPosition;
  attribute vec3 aRandomPosition;
  attribute vec3 aColor;
  attribute float aScale;

  varying vec3 vColor;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 1e4); }
  float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(n + dot(step, vec3(0,0,0))), hash(n + dot(step, vec3(1,0,0))), u.x),
                   mix(hash(n + dot(step, vec3(0,1,0))), hash(n + dot(step, vec3(1,1,1))), u.x), u.y),
               mix(mix(hash(n + dot(step, vec3(0,0,1))), hash(n + dot(step, vec3(1,0,1))), u.x),
                   mix(hash(n + dot(step, vec3(0,1,1))), hash(n + dot(step, vec3(1,1,1))), u.x), u.y), u.z);
  }

  void main() {
    vec3 pos = mix(aRandomPosition, aTargetPosition, uProgress);

    float noiseStrength = mix(2.0, 0.2, uProgress) * uActivity;
    if (uProgress < 0.95) {
      pos.x += sin(uTime * 0.5 * uActivity + pos.y) * 0.5 * uActivity;
      pos.y += cos(uTime * 0.3 * uActivity + pos.x) * 0.5 * uActivity;
    } else {
      pos.z += sin(uTime * 2.0 + pos.x * 2.0) * 0.1 * uActivity;
    }

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
