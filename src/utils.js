import * as THREE from 'three';
import sunTexture from './sun.jpg';

export function create_arena_with_grid(scene, arenaSize){
    const arenaGeometry = new THREE.BoxGeometry(arenaSize, arenaSize, arenaSize);
    const arenaMaterials = [
        new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0x0000ff, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0xff00ff, side: THREE.DoubleSide })
    ];
    const arena = new THREE.Mesh(arenaGeometry, arenaMaterials);
    arena.receiveShadow = true;
    scene.add(arena);
    
    // Create and add GridHelpers to each side of the arena
    const gridSize = arenaSize;
    const gridDivisions = 20;
    
    const gridHelpers = [];
    
    //Front face
    const gridHelperFront = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperFront.position.set(0, 0, arenaSize / 2);
    gridHelperFront.rotation.x = Math.PI / 2;
    gridHelpers.push(gridHelperFront);
    
    // Back face
    const gridHelperBack = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperBack.position.set(0, 0, -arenaSize / 2);
    gridHelperBack.rotation.x = -Math.PI / 2;
    gridHelpers.push(gridHelperBack);
    
    // Top face
    const gridHelperTop = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperTop.position.set(0, arenaSize / 2, 0);
    gridHelperTop.rotation.x = Math.PI ; // Corrected rotation
    gridHelpers.push(gridHelperTop);
    
    // Bottom face
    const gridHelperBottom = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperBottom.position.set(0, -arenaSize / 2, 0);
    gridHelperBottom.rotation.x = -Math.PI; // Corrected rotation
    gridHelpers.push(gridHelperBottom);
    
    // Left face
    const gridHelperLeft = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperLeft.position.set(-arenaSize / 2, 0, 0);
    gridHelperLeft.rotation.z = Math.PI / 2;
    gridHelpers.push(gridHelperLeft);
    
    // Right face
    const gridHelperRight = new THREE.GridHelper(gridSize, gridDivisions);
    gridHelperRight.position.set(arenaSize / 2, 0, 0);
    gridHelperRight.rotation.z = -Math.PI / 2;
    gridHelpers.push(gridHelperRight);
    
    
    // Add all grid helpers to the scene
    gridHelpers.forEach(gridHelper => scene.add(gridHelper));
}

export function createSun(scene){
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(sunTexture);
    
    const geometry1 = new THREE.SphereGeometry(5, 32, 32);
    const light = new THREE.PointLight(0xffffff, 300, 5000);
    const material1 = new THREE.MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: 0xffffff,
        side: THREE.DoubleSide,
    });
    light.add(new THREE.Mesh(geometry1, material1));
    light.position.set(0, 0, 0);
    light.castShadow = true;
    scene.add(light);
    return light;
}
