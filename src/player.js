import * as THREE from 'three';
import { ARENA_SIZE, LINE_SIZE } from './constants.js';

export class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.mesh = this.createPlayerMesh();
        this.camera = this.createPlayerCamera();
        this.mesh.add(this.camera);
        this.points = [];
        this.tubeObject = null;
        this.alive = true;
    }
/**
 * @returns {THREE.Mesh}
 */
    createPlayerMesh() {
        const geometry = new THREE.SphereGeometry(LINE_SIZE, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            transparent: true,
            opacity: 0,
        });

        const playerMesh = new THREE.Mesh(geometry, material);

        const radius = ARENA_SIZE / 2 - 1;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        playerMesh.position.set(x, y, z);

        return playerMesh;
    }

    createPlayerCamera() {
        const playerCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

        const sunPosition = new THREE.Vector3(0, 0, 0);
        const directionToSun = new THREE.Vector3().subVectors(sunPosition, this.mesh.position).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1), directionToSun
        );
        playerCamera.quaternion.copy(quaternion);

        playerCamera.position.set(0, 0, 0);

        return playerCamera;
    }

}


