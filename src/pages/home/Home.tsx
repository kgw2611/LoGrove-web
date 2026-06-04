import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Home.css'
import { getValidToken } from '../../shared/utils/auth'

const HAND_GALLERY_PHOTOS = [
    '/images/lovebug-1.jpg',
    '/images/lovebug-2.jpg',
    '/images/lovebug-3.jpg',
    '/images/lovebug-4.jpg',
    '/images/lovebug-5.jpg',
    '/images/lovebug-6.jpg',
    '/images/lovebug-7.jpg',
    '/images/lovebug-8.jpg',
    '/images/lovebug-9.jpg',
    '/images/lovebug-10.jpg',
]

const CARD_WIDTH = 270
const CARD_GAP = 56
const CARD_PITCH = CARD_WIDTH + CARD_GAP

const HAND_SCROLL_SENSITIVITY = 1800

type CameraStatus = 'loading' | 'ready' | 'blocked'

interface HandLandmark {
    x: number
    y: number
    z?: number
}

interface HandLandmarkerResult {
    landmarks?: HandLandmark[][]
}

interface HandLandmarkerRuntime {
    detectForVideo: (
        video: HTMLVideoElement,
        timestampInMs: number
    ) => HandLandmarkerResult
    close?: () => void
}

function getPalmCenter(landmarks: HandLandmark[]) {
    const palmIndexes = [0, 5, 9, 13, 17]

    const palmPoints = palmIndexes
        .map((index) => landmarks[index])
        .filter((point): point is HandLandmark => Boolean(point))

    if (palmPoints.length < 3) return null

    const sum = palmPoints.reduce(
        (acc, point) => ({
            x: acc.x + point.x,
            y: acc.y + point.y,
        }),
        { x: 0, y: 0 }
    )

    return {
        x: sum.x / palmPoints.length,
        y: sum.y / palmPoints.length,
    }
}

export default function Home() {
    const navigate = useNavigate()

    const galleryRef = useRef<HTMLDivElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const handLandmarkerRef = useRef<HandLandmarkerRuntime | null>(null)
    const rafRef = useRef<number | null>(null)

    const lastPalmXRef = useRef<number | null>(null)
    const trackOffsetRef = useRef<number>(0)

    const isGuideOpenRef = useRef<boolean>(true)
    const selectedLoopIndexRef = useRef<number>(HAND_GALLERY_PHOTOS.length + 2)

    const [isLoggedIn] = useState<boolean>(!!getValidToken())
    const [isGuideOpen, setIsGuideOpen] = useState(true)
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading')
    const [handStatus, setHandStatus] = useState('손을 카메라 안에 보여주세요')
    const [trackOffset, setTrackOffset] = useState(0)
    const [selectedLoopIndex, setSelectedLoopIndex] = useState(
        HAND_GALLERY_PHOTOS.length + 2
    )

    const photos = useMemo(() => HAND_GALLERY_PHOTOS, [])

    const loopedPhotos = useMemo(
        () => [...photos, ...photos, ...photos],
        [photos]
    )

    const oneSetWidth = photos.length * CARD_PITCH

    const updateSelectedLoopIndex = useCallback((index: number) => {
        selectedLoopIndexRef.current = index
        setSelectedLoopIndex(index)
    }, [])

    const resetHandState = useCallback(() => {
        lastPalmXRef.current = null
    }, [])

    const normalizeTrackOffset = useCallback(
        (nextOffset: number) => {
            let normalizedOffset = nextOffset

            if (normalizedOffset <= -oneSetWidth * 2) {
                normalizedOffset += oneSetWidth
            }

            if (normalizedOffset >= 0) {
                normalizedOffset -= oneSetWidth
            }

            return normalizedOffset
        },
        [oneSetWidth]
    )

    const getCenterLoopIndex = useCallback(() => {
        const galleryWidth = galleryRef.current?.clientWidth ?? window.innerWidth
        const centerPositionInTrack =
            -trackOffsetRef.current + galleryWidth / 2

        const rawIndex = Math.round(
            (centerPositionInTrack - CARD_WIDTH / 2) / CARD_PITCH
        )

        const maxIndex = loopedPhotos.length - 1

        return Math.min(Math.max(rawIndex, 0), maxIndex)
    }, [loopedPhotos.length])

    useEffect(() => {
        isGuideOpenRef.current = isGuideOpen
    }, [isGuideOpen])

    useEffect(() => {
        const initialOffset = -oneSetWidth - CARD_PITCH * 2

        trackOffsetRef.current = initialOffset
        setTrackOffset(initialOffset)

        window.requestAnimationFrame(() => {
            updateSelectedLoopIndex(getCenterLoopIndex())
        })
    }, [oneSetWidth, getCenterLoopIndex, updateSelectedLoopIndex])

    const moveGalleryByHand = useCallback(
        (palmX: number) => {
            if (lastPalmXRef.current === null) {
                lastPalmXRef.current = palmX
                return
            }

            const diffX = palmX - lastPalmXRef.current
            const moveAmount = diffX * HAND_SCROLL_SENSITIVITY

            const nextOffset = normalizeTrackOffset(
                trackOffsetRef.current + moveAmount
            )

            trackOffsetRef.current = nextOffset
            setTrackOffset(nextOffset)
            updateSelectedLoopIndex(getCenterLoopIndex())

            lastPalmXRef.current = palmX
            setHandStatus('손 움직임에 맞춰 사진을 넘기는 중입니다')
        },
        [normalizeTrackOffset, getCenterLoopIndex, updateSelectedLoopIndex]
    )

    const handlePhotoClick = (loopIndex: number) => {
        updateSelectedLoopIndex(loopIndex)
        setHandStatus(
            '사진이 선택되었습니다. 손바닥을 좌우로 움직여 다른 사진도 확인해보세요.'
        )
    }

    const handleStartClick = () => {
        if (isLoggedIn) {
            navigate('/study')
        } else {
            navigate('/login')
        }
    }

    const closeGuidePanel = useCallback(() => {
        setIsGuideOpen(false)
        isGuideOpenRef.current = false

        resetHandState()

        setHandStatus('핸드트래킹이 일시정지되었습니다')
    }, [resetHandState])

    const openGuidePanel = useCallback(() => {
        setIsGuideOpen(true)
        isGuideOpenRef.current = true

        resetHandState()
        setHandStatus('손바닥을 좌우로 움직여 사진을 넘겨보세요')
    }, [resetHandState])

    useEffect(() => {
        let cancelled = false

        const stopCamera = () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }

            if (handLandmarkerRef.current?.close) {
                handLandmarkerRef.current.close()
            }
        }

        const startDetectionLoop = () => {
            const detect = () => {
                const video = videoRef.current
                const handLandmarker = handLandmarkerRef.current

                if (!isGuideOpenRef.current) {
                    resetHandState()
                    rafRef.current = requestAnimationFrame(detect)
                    return
                }

                if (video && handLandmarker && video.readyState >= 2) {
                    const result = handLandmarker.detectForVideo(
                        video,
                        performance.now()
                    )

                    const landmarks = result.landmarks?.[0]

                    if (landmarks) {
                        const palmCenter = getPalmCenter(landmarks)

                        if (palmCenter) {
                            moveGalleryByHand(palmCenter.x)
                        }
                    } else {
                        resetHandState()
                        setHandStatus('손을 카메라 안에 보여주세요')
                    }
                }

                rafRef.current = requestAnimationFrame(detect)
            }

            rafRef.current = requestAnimationFrame(detect)
        }

        const setupHandTracking = async () => {
            try {
                setCameraStatus('loading')

                const { FilesetResolver, HandLandmarker } = await import(
                    '@mediapipe/tasks-vision'
                    )

                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                )

                const handLandmarker =
                    await HandLandmarker.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                            delegate: 'GPU',
                        },
                        runningMode: 'VIDEO',
                        numHands: 1,
                        minHandDetectionConfidence: 0.65,
                        minHandPresenceConfidence: 0.65,
                        minTrackingConfidence: 0.65,
                    })

                if (cancelled) return

                handLandmarkerRef.current =
                    handLandmarker as HandLandmarkerRuntime

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user',
                    },
                    audio: false,
                })

                if (cancelled) return

                streamRef.current = stream

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                }

                setCameraStatus('ready')
                setHandStatus('손바닥을 좌우로 움직여 사진을 넘겨보세요')
                startDetectionLoop()
            } catch (error: unknown) {
                console.error(error)
                setCameraStatus('blocked')
                setHandStatus('카메라 권한이 필요합니다')
            }
        }

        void setupHandTracking()

        return () => {
            cancelled = true
            stopCamera()
        }
    }, [moveGalleryByHand, resetHandState])

    return (
        <div className="home-container">
            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        빛을 담아,
                        <br />
                        당신의 숲을 기록하다
                    </h1>

                    <p className="hero-subtitle">
                        Capture your forest in light
                    </p>

                    <div
                        ref={galleryRef}
                        className="hand-gallery-area"
                        aria-label="핸드트래킹 사진 갤러리"
                    >
                        <div
                            className="hand-photo-track live-scroll"
                            style={{
                                transform: `translateX(${trackOffset}px)`,
                            }}
                        >
                            {loopedPhotos.map((photo, index) => {
                                const photoIndex = index % photos.length
                                const isSelected = index === selectedLoopIndex

                                return (
                                    <div
                                        key={`${photo}-${index}`}
                                        className={`hand-photo-card ${
                                            isSelected ? 'selected' : ''
                                        }`}
                                        onClick={() =>
                                            handlePhotoClick(index)
                                        }
                                    >
                                        <img
                                            src={photo}
                                            alt={`러브버그 갤러리 사진 ${
                                                photoIndex + 1
                                            }`}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="cta-box">
                        <span className="cta-text">
                            나에게 딱 맞는 학습 방법이 궁금하다면?
                        </span>

                        <button className="cta-btn" onClick={handleStartClick}>
                            시작하기 →
                        </button>
                    </div>
                </div>

                <aside
                    className={`hand-guide-panel ${
                        isGuideOpen ? 'open' : 'closed'
                    }`}
                >
                    <button
                        type="button"
                        className="hand-guide-close"
                        onClick={closeGuidePanel}
                        aria-label="핸드트래킹 안내 닫기"
                    >
                        ×
                    </button>

                    <div className="hand-guide-info">
                        <div className="hand-guide-icon">
                            👋
                        </div>

                        <div>
                            <p className="hand-guide-step">Step 1/1</p>
                            <strong>사진 넘기기</strong>
                            <span>
                                손바닥을 좌우로 움직여 사진을 넘겨보세요.
                            </span>

                            <em>{handStatus}</em>
                        </div>
                    </div>

                    <div className="hand-camera-box">
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            autoPlay
                            className="hand-camera-video"
                        />

                        <span className="camera-status">
                            {cameraStatus === 'ready'
                                ? 'camera on'
                                : cameraStatus === 'blocked'
                                    ? 'camera blocked'
                                    : 'loading'}
                        </span>
                    </div>
                </aside>

                {!isGuideOpen && (
                    <button
                        type="button"
                        className="show-instructions-btn"
                        onClick={openGuidePanel}
                    >
                        Show Instructions
                        <br />
                        화면보기
                    </button>
                )}
            </main>

            <section className="features-section">
                <div className="cards-container">
                    <Link
                        to="/community"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="feature-card card-orange">
                            <div className="card-badge badge-orange">
                                소통
                            </div>

                            <h3>사진 커뮤니티</h3>

                            <p>
                                다른 포토그래퍼들과 소통하고,
                                <br />
                                의견을 나누어 영감을 얻으세요
                            </p>

                            <div className="card-link">
                                둘러보기 &rarr;
                            </div>
                        </div>
                    </Link>

                    <div
                        onClick={handleStartClick}
                        style={{ cursor: 'pointer', color: 'inherit' }}
                    >
                        <div className="feature-card card-green">
                            <div className="card-badge badge-green">
                                핵심 학습
                            </div>

                            <h3>사진 학습</h3>

                            <p>
                                오늘의 한 컷은 어땠나요?
                                <br />
                                가벼운 퀴즈로 사진을 익히고
                                <br />
                                AI가 분석해주는 내 사진을
                                <br />
                                확인해보세요
                            </p>

                            <div className="card-link link-bold">
                                학습 시작하기 &rarr;
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() =>
                            isLoggedIn
                                ? navigate('/mypage', {
                                    state: { tab: 'gallery' },
                                })
                                : navigate('/login')
                        }
                        style={{ cursor: 'pointer', color: 'inherit' }}
                    >
                        <div className="feature-card card-blue">
                            <div className="card-badge badge-blue">
                                기록
                            </div>

                            <h3>나의 갤러리</h3>

                            <p>
                                매일을 기록하고
                                <br />
                                당신의 숲을 울창하게 가꿔보세요
                                <br />
                                차곡차곡 쌓인 사진들이
                                <br />
                                아름다운 숲을 이룹니다
                            </p>

                            <div className="card-link">
                                갤러리 가기 &rarr;
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}