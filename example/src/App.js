import React, { useRef } from 'react'

import {
    useShare,
    useMedia,
    useCaptureImage,
    useInstall,
    usePwa
} from 'app-hooks'

const App = () => {
    let videoRef = useRef()

    let [isPwa] = usePwa()

    let [share, supportShare] = useShare()

    let [request, stop, isPlaying, isAllow, stream] = useMedia(videoRef, {
        video: true,
        audio: false
    })

    let [prompt, userChoice, isInstallSupport] = useInstall()

    let [capture, captureSrc] = useCaptureImage(videoRef)

    return (
        <main>
            <video ref={videoRef} autoPlay />
            {isPlaying ? (
                <button onClick={stop}>Stop</button>
            ) : (
                <button onClick={request}>Start</button>
            )}
            <button onClick={capture}>Capture</button>
            {!isPwa && isInstallSupport && userChoice !== null ? (
                <button onClick={prompt}>Install</button>
            ) : null}
            {captureSrc ? <img src={captureSrc} /> : null}
            {supportShare ? <button onClick={share}>Share</button> : null}
        </main>
    )
}

export default App
