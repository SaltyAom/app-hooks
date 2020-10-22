import { useState, useEffect, useCallback, useReducer } from 'react'

import {
    PageEvent,
    UseShare,
    UseInstall,
    UsePwa,
    UseMedia,
    UseCaptureImage,
    BeforeInstallPromptEvent,
    CaptureImageConfig
} from './types'

declare global {
    interface Navigator {
        setAppBadge: (badge: number) => void
        clearAppBadge: () => void
    }
}

const isServer = typeof window === 'undefined'

/**
 * React hook for OS native share.
 *
 * @param {ShareData} [shareData] - Pass to navigator.share()
 * @returns {Array.<{share: Function, supportShare: Boolean}>}
 */
export const useShare: UseShare = (shareData) => {
    let canShare = !isServer && 'share' in navigator

    let [supportShare, updateSupportShare] = useState(canShare)

    let share = () => {
        if (supportShare) navigator.share(shareData)
    }

    useEffect(() => {
        // ? SSR support
        updateSupportShare(canShare)
    }, [updateSupportShare])

    return [share, supportShare]
}

/**
 * React hook for displaying PWA prompt.
 *
 * @param {Boolean} [prevent = true] - Should web prevent prompt on enter.
 * @returns {Array.<{prompt: Function, userChoice: Boolean}>}
 */
export const useInstall: UseInstall = (prevent = true) => {
    let [isInstallSupport, supportInstallation] = useReducer(() => true, false)

    let [userChoice, updateUserChoice] = useState<boolean | null>(null),
        [prompt, updatePrompt] = useState<() => Promise<void>>(
            () => new Promise(() => {})
        )

    let deferredPrompt

    let installPwa = (event: BeforeInstallPromptEvent) => {
        deferredPrompt = event

        if (prevent) event.preventDefault()

        supportInstallation()
        updatePrompt(deferredPrompt.prompt)

        deferredPrompt.userChoice.then((choiceResult) => {
            updateUserChoice(choiceResult.outcome === 'accepted')
        })
    }

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', installPwa as any)
    }, [])

    return [prompt, userChoice, isInstallSupport]
}

/**
 * React hook for PWA detection
 *
 * @returns {Array.<{isPwa: Boolean}>}
 */
export const usePwa: UsePwa = () => {
    let [isPwa, updateIsPwa] = useState(false)

    let detectPwa = () => {
        updateIsPwa(
            // @ts-ignore
            // iOS standalone mode
            navigator.standalone ||
                window.matchMedia('(display-mode: standalone)').matches
        )
    }

    useEffect(() => {
        window.addEventListener(PageEvent.DOMContentLoaded, detectPwa, {
            once: true
        })
    }, [])

    return [isPwa]
}

/**
 * React hook for capturing video and audio for Web RTC
 *
 * @param {MediaStreamConstraints} [constraints = { vidoe: true, audio: true }] - Media Stream Constraints
 * @returns {Array.<{stream: MediaStream, isAllowed: boolean}>}
 */
export const useMedia: UseMedia = (
    ref,
    constraints = { video: true, audio: true }
) => {
    let [stream, updateStream] = useState<MediaStream | null>(null),
        [isAllowed, updateAllow] = useState<boolean | null>(null),
        [isPlaying, updatePlaying] = useState(false)

    let request = useCallback(() => {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                if (ref.current !== null) ref.current.srcObject = stream

                updateAllow(true)
                updateStream(stream)
            })
            .catch(() => {
                updateAllow(false)
            })
    }, [])

    useEffect(() => {
        updatePlaying(typeof stream !== 'undefined' && stream !== null)
    }, [stream])

    let stop = useCallback(() => {
        if (stream === null) return

        let tracks = stream.getTracks()

        tracks.forEach((track) => {
            track.stop()
        })

        if (ref.current !== null) ref.current.srcObject = null

        updateStream(null)
    }, [stream])

    return [request, stop, isPlaying, isAllowed, stream]
}

/**
 * Capture Image Config Defination
 *
 * @typedef {Object} CaptureImageConfig
 * @property {String} [format] - Image format
 * @property {Number} [quality] - Image quality between 0 - 100
 */

/**
 * React hook for capture image from video tag.

 * Recommended: Use with useMedia hook.
 *
 * @param {HTMLVideoElement} [videoElement] - Video Element
 * @param {CaptureImageConfig} [config] - Output image config
 * @returns {Array.<{stream: MediaStream, isAllowed: boolean}>}
 */
export const useCaptureImage: UseCaptureImage = (
    videoElement,
    config = {
        format: 'image/jpg',
        quality: 100
    }
) => {
    let [previewImageSrc, updatePreviewImage] = useState<string | null>(null)

    let captureImage = useCallback(() => {
        let video = videoElement.current

        if (video === null) return

        let width = video.offsetWidth,
            height = video.offsetHeight

        let canvas = document.createElement('canvas')

        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d') as CanvasRenderingContext2D

        context?.drawImage(video, 0, 0, width, height)

        let {
            format = 'image/jpg',
            quality = 100
        } = config as CaptureImageConfig

        let base64 = canvas.toDataURL(format, quality)

        updatePreviewImage(base64)
    }, [videoElement, config])

    return [captureImage, previewImageSrc]
}

/**
 * React hook for set app badge
 *
 * @returns {Array.<{setBadge: Function, clearBadge: Function, supportAppBadge: Boolean>}
 */
export const useBadge = () => {
    let [supportAppBadge, updateSupport] = useState('setAppBadge' in navigator)

    useEffect(() => {
        updateSupport('setAppBadge' in navigator)
    }, [navigator])

    let setBadge = (badge: number) => {
        if (supportAppBadge) navigator.setAppBadge(badge)
    }

    let clearBadge = () => {
        if (supportAppBadge) navigator.clearAppBadge()
    }

    return [setBadge, clearBadge, supportAppBadge]
}
