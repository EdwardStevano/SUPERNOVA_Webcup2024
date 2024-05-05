import React, { useEffect, useState, useRef } from "react";
import html2canvas from 'html2canvas';
import {
    loadTinyFaceDetectorModel,
    detectSingleFace,
    TinyFaceDetectorOptions,
    resizeResults,
    matchDimensions,
    draw,
    loadFaceLandmarkTinyModel
} from "face-api.js";
import ImageToFind from './assets/lucasTraining/Lucas.jpeg'
import ImageToFind1 from './assets/lucasTraining/01.jpg'
import ImageToFind2 from './assets/lucasTraining/02.jpg'
import ImageToFind3 from './assets/lucasTraining/03.jpg'
import ImageToFind4 from './assets/lucasTraining/04.jpg'
import ImageToFind5 from './assets/lucasTraining/05.jpg'
import './components/face-animation'

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { initFaceDetectionAnimation } from "./components/face-animation";

const imageTranings = [
    ImageToFind, ImageToFind1, ImageToFind2, ImageToFind3, ImageToFind4, ImageToFind5
]

function FaceDetection() {
    const [video, setVideo] = useState(null);
    const [canvas, setCanvas] = useState(null);
    const [detected, setDetected] = useState(false);
    const [camera, setCamera] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false)

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        setVideo(videoRef.current);
        setCanvas(canvasRef.current);
        start();
    }, []);
    
    const start = async () => {
        await launchCamera();
        const recognition = makeRecognition();
        await recognition.init();
        recognition.start();
    };

    const getFaceDetectorOptions = () =>
        new TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

    const makeRecognition = () => {
        let ctx;

        const init = async () => {
            setLoading(true);
            await loadTinyFaceDetectorModel(`/models`);
            await loadFaceLandmarkTinyModel("/models");
            ctx = canvas.getContext("2d");
        };

        const start = async () => {
            await wait(0);
            if (video.readyState === 4) {
                const faces = await detectSingleFace(
                    video,
                    getFaceDetectorOptions()
                ).withFaceLandmarks(true);
                setLoading(false);
                if (faces) {
                    setDetected(true);
                    const dims = matchDimensions(canvas, video, true);
                    const resizedResults = resizeResults(faces, dims);
                    if (true) {
                        draw.drawDetections(canvas, resizedResults);
                    }
                    if (true) {
                        draw.drawFaceLandmarks(canvas, resizedResults);
                    }
                } else {
                    setDetected(false);
                    ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
                }
            }
            start();
        };

        return { init, start };
    };

    const launchCamera = () =>
        new Promise(resolve => {
            navigator.mediaDevices
                .getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            minWidth: 400,
                            maxWidth: 400,
                            minHeight: 340,
                            maxHeight: 340,
                            minFrameRate: 1,
                            maxFrameRate: 10
                        }
                    }
                })
                .then(
                    stream => {
                        video.srcObject = stream;
                        video.play();
                        setCamera(true);
                        resolve();
                    },
                    () => { }
                )
                .catch(err=> console.log("error"))
        });

    const handleCapture = () => {
        setIsLoading(true)
        // Obtenir l'élément vidéo
        const videoElement = videoRef.current;

        // Capture de l'image à partir de la vidéo
        html2canvas(videoElement)
            .then(canvas => {
                // Convertir le canvas en blob
                return new Promise((resolve, reject) => {
                    canvas.toBlob(blob => {
                        if (blob) {
                            resolve(blob);
                            initFaceDetectionAnimation(URL.createObjectURL(blob))
                        } else {
                            reject(new Error('Échec de la création du blob'));
                        }
                    }, 'image/png');
                });
            })
            .then(async (blob) => {
                const apiKey = "RDzPjbz6GeJ4ho-x0ItJcuhAl2_Dgrfn";
                const apiSecret = "i_7-2_vthKsD5Rg22mSWqEcs9GEKlpdW";
                let traningData = []

                // Utilisation de map pour créer un tableau de promesses
                const promises = imageTranings.map(async (img, index) => {
                    try {
                        const response = await fetch(img);
                        const blob = await response.blob();
                        const newFile = new File([blob], 'imgTrained' + index + '.png', { type: 'image/png' });
                        return newFile;
                    } catch (error) {
                        console.error('Erreur lors du chargement de l\'image :', error);
                        return null;
                    }
                });

                // Utilisation de Promise.all pour attendre que toutes les promesses soient résolues
                Promise.all(promises)
                    .then(files => {
                        // Filtrez les fichiers null (s'ils existent) et affectez les fichiers restants à traningData
                        traningData = files.filter(file => file !== null);

                        if (traningData.length > 0) {
                            const formData = new FormData();
                            formData.append('api_key', apiKey);
                            formData.append('api_secret', apiSecret);
                            formData.append('faces1', traningData);
                            formData.append('image_file1', traningData[0]);
                            formData.append('image_file2', blob);

                            axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', formData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            })
                                .then(response => {
                                    console.log(response.data);
                                    if (response.data.confidence >= 70) {
                                        console.log("Il est là !");
                                        toast.info("Il est là !")
                                    }
                                    else {
                                        console.log("Il est introuvable");
                                        toast.info("Il est introuvable")
                                    }
                                })
                                .catch(error => {
                                    console.error("formData ", formData);
                                    console.error(error);
                                })
                                .finally(() => {
                                    setIsLoading(false)
                                })
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors de la récupération des données d\'entraînement :', error);
                    });



            })
            .catch(error => {
                console.error('Erreur lors de la capture de la photo :', error);
            });
    };

    return (
        <div style={{ position: "relative" }}>
            <ToastContainer />
            {!camera && (
                <button
                    style={{
                        padding: 20,
                        fontSize: 14
                    }}
                    onClick={() => {
                        start();
                    }}
                >
                    Utiliser la caméra
                </button>
            )}
            <div style={{ position: "relative" }}>
                {
                    isLoading &&
                    <div id="three-container"
                        style={{
                            position: "absolute",
                            top: 155,
                            left: 0,
                            width: "100%",
                            height: 340,
                            zIndex: 10,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    ></div>
                }
                <video
                    style={{ position: "absolute", top: 100, left: 0, width: "100%" }}
                    ref={videoRef}
                />
                <canvas
                    style={{ position: "absolute", top: 100, left: 0, width: "100%" }}
                    ref={canvasRef}
                />

                {loading && (
                    <div
                        style={{
                            position: "absolute",
                            top: 200,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,0.5)",
                            zIndex: 1,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        Activation ...
                    </div>
                )}
            </div>
            <br />
            <button className='btn-submit' onClick={handleCapture}>Retrouver maintenant</button>
        </div>
    );
};

const wait = time => new Promise(resolve => setTimeout(resolve, time));

export default FaceDetection