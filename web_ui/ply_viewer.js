let scene, camera, renderer, controls, light, mesh;
let modelCenter = new THREE.Vector3();

export function initPLYViewer(containerId, base64Model) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Container not found:", containerId);
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = Infinity;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0;

    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    // Cargar el modelo
    loadModelFromBase64(base64Model);

    // Boton para centrar
    const recenterBtn = document.getElementById("recenterBtn");
    if (recenterBtn) {
        recenterBtn.style.display = "inline-block";
        recenterBtn.addEventListener('click', recenterModel);
    } else {
        console.error("Recenter button not found.");
    }

    animate();

    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
    });
}

export function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

export function base64ToBlob(base64Data) {
    const base64 = base64Data.split(',')[1];
    const binaryString = atob(base64);
    const length = binaryString.length;
    const uint8Array = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: 'application/octet-stream' });
}

export function loadModelFromBase64(base64Data) {
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        mesh = null;
    }

    const blob = base64ToBlob(base64Data);
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;
        const loader = new THREE.PLYLoader();
        const geometry = loader.parse(arrayBuffer);

        if (geometry) {
            geometry.computeVertexNormals();

            geometry.computeBoundingBox();
            const boundingBox = geometry.boundingBox;
            boundingBox.getCenter(modelCenter);
            geometry.translate(-modelCenter.x, -modelCenter.y, -modelCenter.z);

            const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            console.log("Model loaded and centered.");
        } else {
            console.warn("Failed to load geometry.");
        }
    };

    reader.readAsArrayBuffer(blob);
}

export function recenterModel() {
    if (mesh) {
        mesh.geometry.computeBoundingBox();
        const boundingBox = mesh.geometry.boundingBox;
        boundingBox.getCenter(modelCenter);
        mesh.geometry.translate(-modelCenter.x, -modelCenter.y, -modelCenter.z);

        camera.position.set(modelCenter.x, modelCenter.y, camera.position.z);
        camera.lookAt(modelCenter);

        controls.target.copy(modelCenter);
        controls.update();

        console.log("Model and camera have been recentered.");
    }
}
