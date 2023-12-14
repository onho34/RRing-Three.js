import * as React from "react";
import { useState, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
    CubeCamera,
    AccumulativeShadows,
    RandomizedLight,
    Environment,
    OrbitControls,
    Stars,
} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Vector3 } from "three";
import * as THREE from "three";
import * as glm from "gl-matrix";

function Model({ src, position, ring_x, ring_y, ring_rot }) {
    const meshRef = useRef();
    const object = useLoader(GLTFLoader, src);
    const { geometry, materials, nodes } = object;

    const nodesKeys = Object.keys(object.nodes);

    useFrame((state, delta) => {
        if (meshRef.current) {

            meshRef.current.matrixAutoUpdate = false;
            var model = new THREE.Matrix4(); // Crear una matriz identidad de Three.js

            // traslate
            var translation = new THREE.Vector4(
                ring_x.current,
                ring_y.current,
                0,
            );
            var matrixTranslate = new THREE.Matrix4().makeTranslation(
                translation.x,
                translation.y,
                translation.z
            );
            model.multiply(matrixTranslate);

            // multiply
            var scaleVector = new THREE.Vector4(3, 3, 3);
            var matrixScale = new THREE.Matrix4().makeScale(
                scaleVector.x,
                scaleVector.y,
                scaleVector.z
            );
            model.multiply(matrixScale);

            // rotate
            if (ring_rot.current) {
                console.log(ring_rot)
                var rotMatrix = new THREE.Matrix4()
                    .fromArray(ring_rot.current)
                    .transpose();
                model.multiply(rotMatrix);
            }

            meshRef.current.matrix.copy( model ); // Copiar la nueva matriz al objeto
            meshRef.current.matrixWorldNeedsUpdate = true; // Marcar la matriz para que se actualice

            
        }
    });

    const getMesh = () =>
        nodesKeys.map((nodeKey, index) => (
            <mesh key={index} receiveShadow geometry={nodes[nodeKey].geometry}>
                <meshStandardMaterial
                    {...nodes[nodeKey].material}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
        ));

    return (
        <CubeCamera resolution={256} frames={1}>
            {(texture) => (
                <group ref={meshRef} scale={3.0} position={position}>
                    {getMesh()}
                </group>
            )}
        </CubeCamera>
    );
}

export default function ModelViwer({
    src,
    width,
    height,
    ring_x,
    ring_y,
    ring_rot,
}) {
    return (
        <Canvas
            shadows
            orthographic
            camera={{
                position: [0, 0, 60],
                left: -1,
                right: 1,
                top: -1,
                bottom: 1,
                near: 0.1,
                far: 1000,
                rotation: [0, 0, 0]
            }}
            style={{
                position: "absolute",
                justifyContent: "center",
                alignItems: "center",
                width: width,
                height: height,
            }}
        >
            <ambientLight intensity={0.25} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -5, -10]} />
            <group position={[0, -0.75, 0]}>
                <Model
                    src={src}
                    position={[0, 0, 0]}
                    ring_x={ring_x}
                    ring_y={ring_y}
                    ring_rot={ring_rot}
                />
                <AccumulativeShadows
                    frames={80}
                    color="black"
                    opacity={1}
                    scale={12}
                    position={[0, 0.04, 0]}
                >
                    <RandomizedLight
                        amount={8}
                        radius={5}
                        ambient={0.5}
                        position={[5, 5, -10]}
                        bias={0.001}
                    />
                </AccumulativeShadows>
            </group>
            <Environment preset="city" resolution={512} />
            <OrbitControls makeDefault />
        </Canvas>
    );
}
