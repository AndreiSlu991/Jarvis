const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform vec3 uAccent; uniform float uIntensity; uniform float uMotion;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
float stars(vec2 uv,float scale,float t,float density){ vec2 g=uv*scale,id=floor(g),f=fract(g); float h=hash(id); if(h<density) return 0.0; vec2 pos=vec2(hash(id+1.3),hash(id+2.7))*0.7+0.15; float d=length(f-pos),tw=0.55+0.45*sin(t*(1.0+h*3.0)+h*40.0); return smoothstep(0.06,0.0,d)*tw; }
void main(){
  vec2 frag=gl_FragCoord.xy, uv=(frag-0.5*uRes)/uRes.y;
  float t=uTime*(0.15+0.85*uMotion);
  vec3 col=vec3(0.043,0.037,0.030);
  vec2 par=uMouse*0.06;
  vec2 p1=uv*1.4+vec2(-0.9,-0.45)+par*1.6;
  float n1=fbm(p1+vec2(t*0.05,t*0.03));
  float g1=smoothstep(0.35,1.0,n1)*exp(-1.8*length(uv-vec2(0.62,0.30)-par*2.0));
  vec2 p2=uv*1.1+vec2(0.7,0.8)+par;
  float n2=fbm(p2-vec2(t*0.035,t*0.02));
  float g2=smoothstep(0.40,1.0,n2)*exp(-2.2*length(uv-vec2(-0.72,-0.34)-par*1.2));
  col+=uAccent*g1*(0.55*uIntensity);
  col+=uAccent*vec3(0.85,0.55,0.45)*g2*(0.30*uIntensity);
  float g3=exp(-2.6*length(uv-vec2(-0.55,0.42)-par));
  col+=vec3(0.10,0.12,0.18)*g3*(0.5*uIntensity);
  float s=0.0;
  s+=stars(uv+par*0.5,14.0,t,0.97)*0.35;
  s+=stars(uv+par*1.5+3.7,26.0,t*1.3,0.955)*0.55;
  s+=stars(uv+par*3.0+9.1,44.0,t*1.6,0.965)*0.80;
  col+=mix(vec3(1.0,0.95,0.88),uAccent,0.35)*s*(0.5+0.5*uIntensity);
  float vig=smoothstep(1.35,0.35,length(uv));
  col*=mix(0.75,1.0,vig);
  col+=(hash(frag+fract(uTime))-0.5)*0.018;
  gl_FragColor=vec4(col,1.0);
}`;

function hexToRgb(hex) {
  const m = hex.replace('#','');
  return [parseInt(m.slice(0,2),16)/255, parseInt(m.slice(2,4),16)/255, parseInt(m.slice(4,6),16)/255];
}

export function initBg(canvas) {
  const gl = canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
  if (!gl) { canvas.style.background='#0c0a08'; return {set(){},destroy(){}}; }

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog,'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);

  const U = {};
  ['uRes','uTime','uMouse','uAccent','uIntensity','uMotion'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));

  const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const state = { accent:[1.0,0.62,0.26], intensity:1.0, motion: reduced?0:0.7, mouse:[0,0], target:[0,0], raf:0, dead:false };

  function resize() {
    const dpr=Math.min(devicePixelRatio||1,1.5);
    const w=Math.round(canvas.clientWidth*dpr), h=Math.round(canvas.clientHeight*dpr);
    if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
  }
  const onMove = e => { state.target=[(e.clientX/innerWidth)*2-1, -((e.clientY/innerHeight)*2-1)]; };
  window.addEventListener('pointermove', onMove, {passive:true});
  window.addEventListener('resize', resize);

  const t0 = performance.now();
  function frame() {
    if (state.dead) return;
    resize();
    state.mouse[0]+=(state.target[0]-state.mouse[0])*0.04;
    state.mouse[1]+=(state.target[1]-state.mouse[1])*0.04;
    gl.uniform2f(U.uRes,canvas.width,canvas.height);
    gl.uniform1f(U.uTime,(performance.now()-t0)/1000);
    gl.uniform2f(U.uMouse,state.mouse[0],state.mouse[1]);
    gl.uniform3f(U.uAccent,...state.accent);
    gl.uniform1f(U.uIntensity,state.intensity);
    gl.uniform1f(U.uMotion,state.motion);
    gl.drawArrays(gl.TRIANGLES,0,3);
    state.raf=requestAnimationFrame(frame);
  }
  state.raf=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) cancelAnimationFrame(state.raf);
    else if (!state.dead) state.raf=requestAnimationFrame(frame);
  });

  return {
    set(opts) {
      if (opts.accent) state.accent = typeof opts.accent==='string' ? hexToRgb(opts.accent) : opts.accent;
      if (opts.intensity!==undefined) state.intensity=opts.intensity;
      if (opts.motion!==undefined) state.motion=reduced?0:opts.motion;
    },
    destroy() {
      state.dead=true; cancelAnimationFrame(state.raf);
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('resize',resize);
    }
  };
}
