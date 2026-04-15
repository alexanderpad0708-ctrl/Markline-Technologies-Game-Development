/* ============================================================
   GLOBALS
   ============================================================ */

let engine, scene;
let canvas3D;

let editorCamera;
let playCamera;
let currentCamera;

let selectedObject = null;

let playerMesh = null;
let playerVelY = 0;
let playerOnGround = false;

let keysDown = {};
let playMode = false;

let currentTool = "move";

/* ============================================================
   START PROJECT
   ============================================================ */

function startProject(mode) {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("editorRoot").style.display = "flex";

    document.getElementById("modeLabel").textContent =
        mode === "3d" ? "3D Game" : "2D Game";

    canvas3D = document.getElementById("canvas3D");
    initBabylonScene();
}

/* ============================================================
   BASIC UI
   ============================================================ */

function openFXPopup() {
    document.getElementById("fxPopup").style.display = "block";
}

function cancelFX() {
    document.getElementById("fxPopup").style.display = "none";
}

function toggleAdvancedDrawer() {
    alert("Advanced drawer placeholder");
}

function onSkyChange(color) {
    if (!scene) return;
    const c = BABYLON.Color3.FromHexString(color);
    scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
}

/* ============================================================
   TOOLBOX
   ============================================================ */

function setTool(tool) {
    currentTool = tool;

    document.querySelectorAll(".tool-btn").forEach(btn =>
        btn.classList.remove("active")
    );

    const id = "tool" + tool.charAt(0).toUpperCase() + tool.slice(1);
    const btn = document.getElementById(id);
    if (btn) btn.classList.add("active");
}

function toggleShapesMenu() {
    const menu = document.getElementById("shapesMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/* ============================================================
   SHAPES
   ============================================================ */

function populateShapesMenu() {
    const list = document.getElementById("shapesList");
    list.innerHTML = "";

    const shapes = [
        { id: "box", label: "Box" },
        { id: "sphere", label: "Sphere" },
        { id: "capsule", label: "Capsule" },
        { id: "plane", label: "Plane" }
    ];

    shapes.forEach(s => {
        const div = document.createElement("div");
        div.className = "shapeItem";
        div.textContent = s.label;
        div.onclick = () => addShape3D(s.id);
        list.appendChild(div);
    });
}

function addShape3D(type) {
    let mesh = null;

    switch (type) {
        case "box":
            mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            break;
        case "sphere":
            mesh = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
            break;
        case "capsule":
            mesh = BABYLON.MeshBuilder.CreateCapsule("capsule", { height: 1.5, radius: 0.4 }, scene);
            break;
        case "plane":
            mesh = BABYLON.MeshBuilder.CreatePlane("plane", { size: 1.5 }, scene);
            break;
    }

    mesh.position = new BABYLON.Vector3(0, 1, 0);
    addToHierarchy(mesh);
    selectedObject = mesh;
}

/* ============================================================
   HIERARCHY
   ============================================================ */

function addToHierarchy(mesh) {
    const list = document.getElementById("hierarchyItems");

    const div = document.createElement("div");
    div.className = "item";
    div.textContent = mesh.name;
    div.onclick = () => {
        selectedObject = mesh;
        document.querySelectorAll(".item").forEach(i => i.classList.remove("selected"));
        div.classList.add("selected");
    };

    list.appendChild(div);
}

/* ============================================================
   BABYLON SCENE
   ============================================================ */

function initBabylonScene() {
    engine = new BABYLON.Engine(canvas3D, true);
    scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0.6, 0.7, 1.0, 1);

    editorCamera = new BABYLON.ArcRotateCamera(
        "editorCam",
        -Math.PI / 2,
        Math.PI / 3,
        12,
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    editorCamera.attachControl(canvas3D, true);
    currentCamera = editorCamera;

    const light = new BABYLON.HemisphericLight("h", new BABYLON.Vector3(0, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);

    populateShapesMenu();

    setupCameraControls();
    setupTransformControls();

    engine.runRenderLoop(() => scene.render());
}

/* ============================================================
   EDITOR CAMERA CONTROLS
   ============================================================ */

function setupCameraControls() {
    scene.onBeforeRenderObservable.add(() => {
        if (playMode) return;

        const speed = keysDown["Shift"] ? 0.6 : 0.25;

        const forward = editorCamera.getDirection(BABYLON.Axis.Z);
        const right = editorCamera.getDirection(BABYLON.Axis.X);

        if (keysDown["w"]) {
            editorCamera.target.addInPlace(forward.scale(speed));
            editorCamera.position.addInPlace(forward.scale(speed));
        }
        if (keysDown["s"]) {
            editorCamera.target.addInPlace(forward.scale(-speed));
            editorCamera.position.addInPlace(forward.scale(-speed));
        }
        if (keysDown["a"]) {
            editorCamera.target.addInPlace(right.scale(-speed));
            editorCamera.position.addInPlace(right.scale(-speed));
        }
        if (keysDown["d"]) {
            editorCamera.target.addInPlace(right.scale(speed));
            editorCamera.position.addInPlace(right.scale(speed));
        }
    });
}

/* ============================================================
   TRANSFORM TOOLS
   ============================================================ */

let isDragging = false;

function setupTransformControls() {
    scene.onPointerObservable.add((info) => {
        if (info.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (info.pickInfo.hit) {
                selectedObject = info.pickInfo.pickedMesh;
                isDragging = true;
            }
        }

        if (info.type === BABYLON.PointerEventTypes.POINTERUP) {
            isDragging = false;
        }

        if (info.type === BABYLON.PointerEventTypes.POINTERMOVE && isDragging && selectedObject) {
            const dx = info.event.movementX * 0.01;
            const dy = info.event.movementY * 0.01;

            switch (currentTool) {
                case "move":
                    selectedObject.position.x += dx;
                    selectedObject.position.z += dy;
                    break;

                case "scale":
                    selectedObject.scaling.x += dx;
                    selectedObject.scaling.y += dx;
                    selectedObject.scaling.z += dx;
                    break;

                case "rotate":
                    selectedObject.rotation.y += dx * 2;
                    break;

                case "select":
                    break;
            }
        }
    });
}

/* ============================================================
   PLAY MODE
   ============================================================ */

function enterPlayMode() {
    if (playMode) return;
    playMode = true;

    editorCamera.detachControl(canvas3D);

    playCamera = new BABYLON.UniversalCamera("playCam", new BABYLON.Vector3(0, 2, -5), scene);
    playCamera.attachControl(canvas3D, true);
    currentCamera = playCamera;

    playerMesh = BABYLON.MeshBuilder.CreateCapsule("player", { height: 1.4, radius: 0.4 }, scene);
    playerMesh.position = new BABYLON.Vector3(0, 1, 0);

    playerVelY = 0;
    playerOnGround = false;

    scene.onBeforeRenderObservable.add(updatePlayer);
}

function exitPlayMode() {
    playMode = false;

    if (playCamera) playCamera.detachControl(canvas3D);
    if (playerMesh) playerMesh.dispose();

    editorCamera.attachControl(canvas3D, true);
    currentCamera = editorCamera;
}

function updatePlayer() {
    if (!playMode || !playerMesh) return;

    playerVelY -= 0.01;
    playerMesh.position.y += playerVelY;

    if (playerMesh.position.y <= 0) {
        playerMesh.position.y = 0;
        playerVelY = 0;
        playerOnGround = true;
    }

    let moveX = 0;
    let moveZ = 0;

    if (keysDown["w"]) moveZ += 0.12;
    if (keysDown["s"]) moveZ -= 0.12;
    if (keysDown["d"]) moveX += 0.12;
    if (keysDown["a"]) moveX -= 0.12;

    playerMesh.position.x += moveX;
    playerMesh.position.z += moveZ;

    playCamera.position.x = playerMesh.position.x;
    playCamera.position.z = playerMesh.position.z - 3;
    playCamera.position.y = playerMesh.position.y + 1.5;
    playCamera.setTarget(playerMesh.position);
}

/* ============================================================
   INPUT
   ============================================================ */

document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);