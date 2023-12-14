import {
    HandLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

import { useState } from "react";

export function MediaPipeHand() {
    const [HandModel, setHandModel] = useState()
    useEffect(() => {
        async function CreateMediaPipeHandModel() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "hand_landmarker.task",
                    delegate: "GPU",
                },
                numHands: 2,
            });
            setHandModel( handLandmarker )
            console.log('HandModel loaded...')
        }
        CreateMediaPipeHandModel();
     }, [])
}
