// main.js
// AP1.13-ready structure (TS-friendly)

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ===== DEFAULT PLAYERS =====
const PLAYERS = [
  "QualityAssurance",
  "TestSubject"
];

// ===== QUALITY PRESETS =====
class Quality {
  static PRESETS = {
    POTATO: { terrain: 64,  water: 32 },
    MEDIUM: { terrain: 128, water: 64 },
    GREAT:  { terrain: 192, water: 96 },
    ULTRA:  { terrain: 256, water: 128 }
  };

  constructor(level = "ULTRA") {
    this.level = level;
    this.settings = Quality.PRESETS[level];
  }
}

// ===== ENGINE CORE =====
class Engine {
  constructor(qualityLevel = "ULTRA") {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;

    this.systems = [];
    this.quality = new Quality(qualityLevel);

    this.lake = {
      center: new THREE.Vector3(16, 0, -10),
      radius: 16,
      bottom: -2.0,
      waterLevel: 0.25
    };
  }

  addSystem(system) {
    this.systems.push(system);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
  }

  initLights() {
    this.scene.background = new THREE.Color(0x346beb);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff4d0, 1.0);
    sun.position.set(40, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);
  }

  start() {
    this.initRenderer();
    this.initCamera();
    this.initLights();

    for (const sys of this.systems) {
      if (sys.init) sys.init(this);
    }

    const loop = () => {
      requestAnimationFrame(loop);
      const dt = this.clock.getDelta();

      for (const sys of this.systems) {
        if (sys.update) sys.update(dt, this);
      }

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }
}

// ===== TERRAIN =====
class Terrain {
  constructor() {
    this.mesh = null;
    this.raycaster = new THREE.Raycaster();
    this.down = new THREE.Vector3(0, -1, 0);
  }

  init(engine) {
    const Q = engine.quality.settings;
    const size = 200;
    const seg = Q.terrain;

    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const lake = engine.lake;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let h =
        Math.sin(x * 0.18) * 1.5 +
        Math.cos(z * 0.06) * 1.2 +
        Math.sin(x * 0.15 + z * 0.12) * 0.7;

      const dx = x - lake.center.x;
      const dz = z - lake.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < lake.radius) {
        const t = dist / lake.radius;
        const shoreline = t * t * t;
        const craterDepth = 0.45;
        h = THREE.MathUtils.lerp(
          lake.bottom * craterDepth,
          h,
          shoreline
        );
      }

      pos.setY(i, h);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x38b538,
      roughness: 1.0,
      metalness: 0.0
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    engine.scene.add(this.mesh);
  }

  getGroundHit(pos, height) {
    const origin = pos.clone().add(new THREE.Vector3(0, height * 2, 0));
    this.raycaster.set(origin, this.down);
    this.raycaster.far = height * 4 + 50;
    const hits = this.raycaster.intersectObject(this.mesh, false);
    return hits.length ? hits[0] : null;
  }
}

// ===== WATER =====
class Water {
  constructor() {
    this.mesh = null;
    this.base = null;
  }

  init(engine) {
    const Q = engine.quality.settings;
    const lake = engine.lake;

    const geo = new THREE.PlaneGeometry(
      lake.radius * 2,
      lake.radius * 2,
      Q.water,
      Q.water
    );
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x7fc9ff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(
      lake.center.x,
      lake.waterLevel,
      lake.center.z
    );
    engine.scene.add(this.mesh);

    this.base = new Float32Array(geo.attributes.position.array);
  }

  update(dt, engine) {
    const arr = this.mesh.geometry.attributes.position.array;
    const base = this.base;
    const time = engine.clock.getElapsedTime();

    const s1 = 0.25;
    const s2 = 0.18;

    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];

      const h =
        Math.sin((x + time) * s1) * 0.15 +
        Math.sin((z + time * 0.7) * s2) * 0.12;

      arr[i + 1] = base[i + 1] + h;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  isInWater(pos, radius, lake) {
    const dx = pos.x - lake.center.x;
    const dz = pos.z - lake.center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > lake.radius) return false;
    return pos.y - radius < lake.waterLevel + 0.05;
  }
}

// ===== PLAYER =====
class Player {
  constructor() {
    this.mesh = null;
    this.velocity = new THREE.Vector3();
    this.height = 1;
    this.radius = 0.5;
  }

  init(engine) {
    const geo = new THREE.SphereGeometry(0.5, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x5fb4ff
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 5, 0);
    engine.scene.add(this.mesh);

    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    this.height = size.y || 1;
    this.radius = this.height / 2;
  }
}

// ===== CAMERA CONTROLLER =====
class CameraController {
  constructor() {
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.distance = 6;
    this.currentPos = new THREE.Vector3();

    this.lastMouseMove = performance.now();
    this.freezeDelay = 80;

    this.shiftLock = false;
  }

  init(engine) {
    this.camera = engine.camera;
    this.player = engine.systems.find(s => s instanceof Player).mesh;

    const dom = engine.renderer.domElement;
    const overlay = document.getElementById("overlay");
    const crosshair = document.getElementById("crosshair");

    dom.addEventListener("click", () => {
      dom.requestPointerLock();
      if (overlay) overlay.style.display = "none";
    });

    this.onMouseMove = (e) => {
      if (document.pointerLockElement !== dom) return;

      const sens = 0.0022;
      this.targetYaw -= e.movementX * sens;
      this.targetPitch -= e.movementY * sens;

      const maxPitch = Math.PI / 2 - 0.1;
      this.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, this.targetPitch));

      this.lastMouseMove = performance.now();
    };

    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement === dom) {
        document.addEventListener("mousemove", this.onMouseMove);
      } else {
        document.removeEventListener("mousemove", this.onMouseMove);
      }
    });

    // CTRL (Win/Linux) or Command (macOS) toggles Shift-Lock
    window.addEventListener("keydown", (e) => {
      if (
        e.code === "ControlLeft" ||
        e.code === "ControlRight" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight"
      ) {
        this.shiftLock = !this.shiftLock;
        if (crosshair) {
          crosshair.style.display = this.shiftLock ? "block" : "none";
        }
      }
    });
  }

  update(dt, engine) {
    const now = performance.now();
    const moving = (now - this.lastMouseMove) < this.freezeDelay;

    if (moving) {
      this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, 0.35);
      this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, 0.35);
    }

    // Shift-Lock: camera stays behind player
    if (this.shiftLock) {
      this.yaw = this.targetYaw;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.2, 1.2);
    }

    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const offset = dir.multiplyScalar(this.distance);
    const target = this.player.position.clone().add(new THREE.Vector3(0, 0.4, 0));
    const desired = target.clone().sub(offset);

    this.currentPos.lerp(desired, 0.25);
    engine.camera.position.copy(this.currentPos);
    engine.camera.lookAt(target);
  }
}

// ===== PHYSICS (with Jump) =====
class Physics {
  constructor() {
    this.keys = {};
    this.onGround = false;
    this.wasInWater = false;
  }

  init(engine) {
    this.player = engine.systems.find(s => s instanceof Player);
    this.terrain = engine.systems.find(s => s instanceof Terrain);
    this.water = engine.systems.find(s => s instanceof Water);
    this.cameraController = engine.systems.find(s => s instanceof CameraController);

    window.addEventListener("keydown", e => this.keys[e.code] = true);
    window.addEventListener("keyup", e => this.keys[e.code] = false);
  }

  update(dt, engine) {
    const lake = engine.lake;
    const p = this.player.mesh.position;
    const v = this.player.velocity;

    const inWater = this.water.isInWater(p, this.player.radius, lake);

    const yaw = this.cameraController.yaw;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward);

    const accel = new THREE.Vector3();
    if (this.keys["KeyW"]) accel.add(forward);
    if (this.keys["KeyS"]) accel.sub(forward);
    if (this.keys["KeyA"]) accel.add(right);
    if (this.keys["KeyD"]) accel.sub(right);

    if (accel.lengthSq() > 0) {
      accel.normalize().multiplyScalar(inWater ? 20 : 30);
      v.x += accel.x * dt;
      v.z += accel.z * dt;
    } else {
      const friction = inWater ? 6 : 10;
      v.x -= v.x * friction * dt;
      v.z -= v.z * friction * dt;
    }

    // ===== JUMP =====
    if (!inWater) {
      if (this.onGround && this.keys["Space"]) {
        v.y = 10; // jump strength
        this.onGround = false;
      }
      v.y += -22 * dt;
      if (v.y < 0) v.y += v.y * -0.25 * dt;
    } else {
      v.y += -8 * dt;
      v.y *= 0.9;

      if (this.keys["Space"]) v.y += 7 * dt;
      if (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) v.y -= 7 * dt;
    }

    v.y = Math.max(v.y, -25);

    p.addScaledVector(v, dt);

    const hit = this.terrain.getGroundHit(p, this.player.height);
    if (hit) {
      const groundY = hit.point.y + this.player.radius + 0.03;
      if (p.y < groundY) {
        p.y = THREE.MathUtils.lerp(p.y, groundY, 0.35);
        if (v.y < 0) v.y = 0;
        this.onGround = !inWater;
      } else {
        this.onGround = false;
      }
    } else {
      this.onGround = false;
    }

    // Player faces camera direction when Shift-Lock is active
    if (this.cameraController.shiftLock) {
      const targetYaw = this.cameraController.yaw;
      const currentYaw = this.player.mesh.rotation.y;
      this.player.mesh.rotation.y = THREE.MathUtils.lerp(
        currentYaw,
        targetYaw,
        0.25
      );
    }

    this.wasInWater = inWater;
  }
}

// ===== LEADERBOARD =====
class Leaderboard {
  init(engine) {
    const lb = document.getElementById("leaderboard");
    if (!lb) return;

    lb.style.position = "fixed";
    lb.style.top = "10px";
    lb.style.right = "10px";
    lb.style.padding = "8px 10px";
    lb.style.background = "rgba(0,0,0,0.35)";
    lb.style.color = "white";
    lb.style.fontFamily = "system-ui";
    lb.style.borderRadius = "6px";
    lb.style.zIndex = "9999";

    lb.innerHTML = "<strong>Players</strong><br>" +
      PLAYERS.join("<br>");
  }

  update() {}
}

// ===== MENU SYSTEM =====
class MenuSystem {
  constructor() {
    this.menuOverlay = null;
    this.menuButton = null;
    this.menuClose = null;
    this.usernameLabel = null;
  }

  init(engine) {
    this.menuOverlay = document.getElementById("menuOverlay");
    this.menuButton = document.getElementById("menuButton");
    this.menuClose = document.getElementById("menuClose");
    this.usernameLabel = document.getElementById("usernameLabel");

    const saved = localStorage.getItem("marklineAccount");
    if (saved && this.usernameLabel) this.usernameLabel.textContent = saved;

    if (this.menuButton) {
      this.menuButton.addEventListener("click", () => this.show());
    }

    if (this.menuClose) {
      this.menuClose.addEventListener("click", () => this.hide());
    }

    if (this.menuOverlay) {
      this.menuOverlay.addEventListener("click", (e) => {
        if (e.target === this.menuOverlay) this.hide();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") this.toggle();
    });

    const leaveBtn = document.getElementById("leaveBtn");
    if (leaveBtn) {
      leaveBtn.addEventListener("click", () => {
        window.location.href = "../index.html";
      });
    }
  }

  show() {
    if (this.menuOverlay) this.menuOverlay.style.display = "flex";
  }

  hide() {
    if (this.menuOverlay) this.menuOverlay.style.display = "none";
  }

  toggle() {
    if (!this.menuOverlay) return;
    if (this.menuOverlay.style.display === "flex") this.hide();
    else this.show();
  }

  update() {}
}

// ===== BOOTSTRAP =====
const engine = new Engine("ULTRA");

engine.addSystem(new Terrain());
engine.addSystem(new Water());
engine.addSystem(new Player());
engine.addSystem(new CameraController());
engine.addSystem(new Physics());
engine.addSystem(new Leaderboard());
engine.addSystem(new MenuSystem());

engine.start();