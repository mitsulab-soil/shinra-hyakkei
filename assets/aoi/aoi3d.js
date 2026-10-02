/* 森羅百景の碧（AI）の 3D の姿 ── 2026-10-03。元＝_dev/aoi_src/aoi3d.js（_dev/aoi.py が assets/aoi/ へ写す）。
   「3D の碧を呼ぶ」を押したときだけ、aoi.js が import() で読む（はじめの表示では何も取りに行かない）。
   three@0.170.0 と @pixiv/three-vrm@3.5.5 は jsDelivr の版固定（ページの importmap）。《Feel Hikawa》と同じ組み合わせ。
   姿＝assets/aoi/aoi.vrm（白磁 案A の Web 配信用の派生・約 2 MB。形は EXT_meshopt_compression、絵は WebP）。
   動き＝腕を脇へ下ろす・呼吸・まばたき・視線は見る人へ（《Feel Hikawa》の aoiPose と同じ値）。動きを減らす設定なら止める。 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

export async function show(stage, url, onProgress) {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = () => stage.clientWidth || innerWidth, Hh = () => stage.clientHeight || innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W(), Hh());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, W() / Hh(), 0.1, 20);
  camera.position.set(0, 1.05, 3.9);
  scene.add(new THREE.HemisphereLight(0xeef6f3, 0x3a3a34, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(1.2, 2.4, 2); scene.add(sun);
  const ctl = new OrbitControls(camera, renderer.domElement);
  ctl.target.set(0, 0.86, 0); ctl.enablePan = false; ctl.minDistance = 1.0; ctl.maxDistance = 5.5;
  ctl.minPolarAngle = 0.5; ctl.maxPolarAngle = 1.75; ctl.enableDamping = true; ctl.update();

  const ld = new GLTFLoader();
  ld.setMeshoptDecoder(MeshoptDecoder);
  ld.register(p => new VRMLoaderPlugin(p));
  const g = await ld.loadAsync(url, e => { if (e.total) onProgress?.(Math.round(e.loaded / e.total * 100)); });
  const vrm = g.userData.vrm; if (!vrm) throw new Error("VRM ではない");
  VRMUtils.removeUnnecessaryVertices(g.scene);
  (VRMUtils.combineSkeletons ?? VRMUtils.removeUnnecessaryJoints)?.(g.scene);
  VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse(o => { o.frustumCulled = false; });
  scene.add(vrm.scene);
  const gaze = new THREE.Object3D(); scene.add(gaze); if (vrm.lookAt) vrm.lookAt.target = gaze;
  const N = n => vrm.humanoid?.getNormalizedBoneNode(n);
  const set = (n, x, y, z) => { const b = N(n); if (b) b.rotation.set(x, y, z); };
  let blink = 2, bt = -1, raf = 0, last = performance.now();
  function pose(dt) {
    const t = performance.now() / 1000, br = RM ? 0 : Math.sin(t * 2 * Math.PI / 4.6);
    set("leftUpperArm", 0, 0, -1.22); set("rightUpperArm", 0, 0, 1.22);
    set("leftLowerArm", 0, 0.18, 0); set("rightLowerArm", 0, -0.18, 0);
    set("spine", -0.006 * br, 0, 0); set("chest", -0.012 * br, 0, 0); set("upperChest", -0.01 * br, 0, 0);
    set("leftShoulder", 0, 0, 0.006 * br); set("rightShoulder", 0, 0, -0.006 * br);
    let bv = 0;
    if (!RM) {
      if (bt < 0) { blink -= dt; if (blink <= 0) bt = 0; }
      else { bt += dt; const u = bt; bv = u < .09 ? u / .09 : u < .12 ? 1 : u < .26 ? 1 - (u - .12) / .14 : 0; if (u >= .26) { bt = -1; blink = 3.5 + Math.random() * 4.5; } }
    }
    vrm.expressionManager?.setValue("blink", bv * bv * (3 - 2 * bv));
    gaze.position.copy(camera.position);
  }
  function fit() { renderer.setSize(W(), Hh()); camera.aspect = W() / Hh(); camera.updateProjectionMatrix(); }
  addEventListener("resize", fit);
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    pose(dt); vrm.update(dt); ctl.update(); renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return {
    dispose() {
      cancelAnimationFrame(raf); removeEventListener("resize", fit); ctl.dispose();
      scene.remove(vrm.scene); VRMUtils.deepDispose(vrm.scene); renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
