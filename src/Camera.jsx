import React, { useEffect, useRef, useState } from "react";
import {
    HandLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { drawLandmarks, drawConnectors } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import ModelViwer from "./render3d.jsx";
import * as math from "mathjs";
// import * as THREE from "three";
import { Matrix4 } from "three";

export const CameraComponent = ({
    id_video = "video",
    id_canvas = "canvas",
}) => {
    let [screenWidth, setScreenWidth] = useState(window.innerWidth);
    let [screenHeight, setScreenHeight] = useState(window.innerHeight);
    let ringPosX = useRef(0);
    let ringPosY = useRef(0);
    let rotRingMat = useRef(null);

    const videoRef = useRef(null);
    const videoParams = {
        width: { ideal: screenWidth },
        height: { ideal: screenHeight },
        facingMode: "user",
    };

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: videoParams })
                .then((stream) => {
                    let video = videoRef.current;
                    video.srcObject = stream;
                    video.oncanplay = () => video.play();
                });
        }
    }, []);

    useEffect(() => {
        function handleResize() {
            setScreenWidth(videoRef.current.videoWidth);
            setScreenHeight(videoRef.current.videoHeight);
            // console.log("current_size_w:", videoRef.current.videoWidth);
            // console.log("current_size_h:", videoRef.current.videoHeight);
        }

        videoRef.current.addEventListener("resize", handleResize);
        return () =>
            videoRef.current.removeEventListener("resize", handleResize);
    }, [videoRef]);

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#303030",
                minHeight: "100vh",
            }}
        >
            <video
                id={id_video}
                ref={videoRef}
                width={{ screenWidth }}
                height={{ screenHeight }}
                style={{
                    position: "absolute",
                    transform: "scaleX(-1)",
                    clear: "both",
                    display: "block",
                    border: "0",
                    margin: "auto",
                }}
                autoPlay
                playsInline
            />

            {/* <canvas
                id={id_canvas}
                style={{
                    position: "absolute",
                    margin: "auto",
                    border: "0",
                    zIndex: 0,
                }}
            /> */}

            <ModelViwer
                src="./src/assets/models3d/jesus.gltf"
                width={screenWidth}
                height={screenHeight}
                ring_x={ringPosX}
                ring_y={ringPosY}
                ring_rot={rotRingMat}
            />
            <MediaPipeHand
                videoRef={videoRef}
                width={screenWidth}
                height={screenHeight}
                setRingPosX={ringPosX}
                setRingPosY={ringPosY}
                rotRingMat={rotRingMat}
            />
        </div>
    );
};

export function MediaPipeHand({
    setRingPosX,
    setRingPosY,
    videoRef,
    rotRingMat,
    id_video = "video",
    id_canvas = "canvas",
}) {
    // const [HandModel, setHandModel] = useState(null);
    const HandModel = useRef(null);

    useEffect(() => {
        async function CreateMediaPipeHandModel() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const handLandmarker = await HandLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU",
                    },
                    numHands: 2,
                    runningMode: "video",
                }
            );
            HandModel.current = handLandmarker;
            // setHandModel(handLandmarker);
            console.log("HandModel loaded...");
        }
        CreateMediaPipeHandModel();
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        video.onplaying = function () {
            console.log("video started");
            let lastVideoTime = -1;
            const video = document.getElementById(id_video);
            const canvas = document.getElementById(id_canvas);
            const canvasCtx = canvas.getContext("2d");
            let results;

            function renderLoop() {
                canvas.style.width = video.videoWidth;
                canvas.style.height = video.videoHeight;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                let startTimeMs = performance.now();
                if (video.currentTime !== lastVideoTime) {
                    lastVideoTime = video.currentTime;
                    if (HandModel.current) {
                        results = HandModel.current.detectForVideo(
                            video,
                            startTimeMs
                        );
                        // reflect all results for mirror video
                        if (results.landmarks) {
                            for (const landmarks of results.landmarks) {
                                for (let mark of landmarks) {
                                    mark.x = 1 - mark.x;
                                }
                            }
                        }
                    } else {
                        console.log("not hand model");
                        results = { landmarks: [] };
                    }
                    // console.log(results);
                }

                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                if (results.landmarks) {
                    for (const landmarks of results.landmarks) {
                        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                            color: "#00FF00",
                            lineWidth: 5,
                        });
                        drawLandmarks(canvasCtx, landmarks, {
                            color: "#FF0000",
                            lineWidth: 2,
                        });
                        // console.log("drawed");
                    }
                }
                canvasCtx.restore();

                if (results.landmarks) {
                    for (const landmarks of results.landmarks) {
                        const mark_13 = landmarks[13];
                        const mark_14 = landmarks[14];
                        let x = (mark_13.x + mark_14.x) / 2;
                        let y = (mark_13.y + mark_14.y) / 2;
                        setRingPosX.current =
                            x * video.videoWidth - video.videoWidth / 2;
                        setRingPosY.current =
                            (y * video.videoHeight - video.videoHeight / 2) *
                            -1;

                        let rot = getModeMatrix(
                            landmarks[14],
                            landmarks[13],
                            landmarks[5]
                        );
                        rotRingMat.current = rot;
                        // console.log("rot", rot);
                    }
                }
                requestAnimationFrame(() => {
                    renderLoop();
                });
            }
            renderLoop();
        };
    }, [HandModel, videoRef]);
}

function cross(v0, v1) {
    return [
        v0[1] * v1[2] - v0[2] * v1[1],
        -(v0[0] * v1[2] - v0[2] * v1[0]),
        v0[0] * v1[1] - v0[1] * v1[0],
    ];
}

function dot(v0, v1) {
    return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
}

function normalize(v) {
    let norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (norm === 0) return v;
    return [v[0] / norm, v[1] / norm, v[2] / norm];
}

function matrixMul(A, B) {
    let result = new Array(A.length)
        .fill(0)
        .map((row) => new Array(B[0].length).fill(0));
    return result.map((row, i) => {
        return row.map((val, j) => {
            return A[i].reduce((sum, elm, k) => sum + elm * B[k][j], 0);
        });
    });
}

function normalizeAngle(angle) {
    return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}

function getModeMatrix(p14, p13, p5) {
    let r = normalize([(p14.x - p13.x), -(p14.y - p13.y), (p14.z - p13.z)]);
    let m = normalize([( p5.x - p13.x), -( p5.y - p13.y), ( p5.z - p13.z)]);

    let mp = normalize(m.map((value, index) => value - r[index] * dot(r, m)));

    let d = normalize(cross(r, mp));

    let rot = [
        [r[0], r[1], r[2], 0],
        [mp[0], mp[1], mp[2], 0],
        [d[0], d[1], d[2], 0],
        [0, 0, 0, 1],
    ];

    

    console.log( rot )
    rot = [
        rot[0][0],
        rot[0][1],
        rot[0][2],
        rot[0][3],
        rot[1][0],
        rot[1][1],
        rot[1][2],
        rot[1][3],
        rot[2][0],
        rot[2][1],
        rot[2][2],
        rot[3][3],
        rot[3][0],
        rot[3][1],
        rot[3][2],
        rot[3][3],
    ];
    return rot;
}

// let rot_x = [
//     [1, 0, 0, 0],
//     [0,  Math.cos(-Math.PI / 2), -Math.sin(-Math.PI / 2), 0],
//     [0, -Math.sin(-Math.PI / 2), Math.cos(-Math.PI / 2), 0],
//     [0, 0, 0, 1]
// ];
// rot = matrixMul(rot_x, rot);
