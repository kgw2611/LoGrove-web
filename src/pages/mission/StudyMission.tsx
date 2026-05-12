import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { apiClient } from '../../shared/api/client'
import './StudyMission.css'

// 백엔드 MissionResponse.level: 0=Level1(200p), 1=Level2(300p), 2=Level3(500p)
const PHOTO_LEVEL_POINT: Record<number, number> = { 0: 200, 1: 300, 2: 500 }
const PHOTO_LEVEL_LABEL: Record<number, string> = { 0: 'Level 1', 1: 'Level 2', 2: 'Level 3' }

type PhotoCard = {
    missionId: number
    theme: string
    level: number
    state?: 'INCOMPLETE' | 'COMPLETED'
    sampleUrl?: string
    color: 'green' | 'purple'
}

type PhotoDetail = {
    theme?: string
    content?: string
    guide?: string
    sampleUrl?: string
    sample_url?: string
    passScore?: number
    pass_score?: number
}

type GradingResult = {
    score: number
    result?: 'PASS' | 'FAIL'
    feedback?: string
}


export default function StudyMission() {
    const navigate = useNavigate()
    const [cards, setCards] = useState<PhotoCard[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedCard, setSelectedCard] = useState<PhotoCard | null>(null)
    const [detail, setDetail] = useState<PhotoDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [modalStep, setModalStep] = useState<'desc' | 'upload' | 'loading' | 'result'>('desc')

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [result, setResult] = useState<GradingResult | null>(null)
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)

    useEffect(() => {
        apiClient.get('/learning/photo')
            .then(res => {
                const list = res.data.data || res.data || []
                const mapped: PhotoCard[] = list.map((item: Record<string, unknown>, idx: number) => ({
                    missionId: (item.missionId ?? item.id ?? 0) as number,
                    theme: (item.title ?? `사진 미션 ${idx + 1}`) as string,
                    level: (item.level ?? 0) as number,
                    state: item.state as 'INCOMPLETE' | 'COMPLETED' | undefined,
                    sampleUrl: (item.sampleUrl ?? item.sample_url) as string | undefined,
                    color: item.state === 'COMPLETED' ? 'purple' : 'green',
                }))
                setCards(mapped)
            })
            .catch(e => console.error('사진 미션 목록 불러오기 실패:', e))
            .finally(() => setLoading(false))
    }, [])

    const openModal = async (card: PhotoCard) => {
        setSelectedCard(card)
        setDetail(null)
        setDetailLoading(true)
        setModalStep('desc')
        setImageFile(null)
        setPreviewImage(null)
        setResult(null)
        setWasAlreadyCompleted(card.state === 'COMPLETED')
        try {
            const res = await apiClient.get(`/learning/${card.missionId}/photo`)
            setDetail(res.data.data || res.data || {})
        } catch (e) {
            console.error('사진 미션 상세 불러오기 실패:', e)
        } finally {
            setDetailLoading(false)
        }
    }

    const closeModal = () => {
        setSelectedCard(null)
        setWasAlreadyCompleted(false)
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setPreviewImage(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmitClick = async () => {
        if (modalStep === 'desc') { setModalStep('upload'); return }
        if (modalStep === 'upload') {
            if (!imageFile) { alert('사진을 먼저 첨부해 주세요!'); return }
            const token = localStorage.getItem('access_token')
            if (!token) { alert('로그인이 필요한 서비스입니다.'); navigate('/login'); return }
            setModalStep('loading')
            const formData = new FormData()
            formData.append('file', imageFile)
            try {
                const res = await apiClient.post(`/learning/${selectedCard!.missionId}/photo/submit`, formData)
                const data = res.data.data || res.data
                const passed = data.isSuccess ?? (data.result === 'PASS')
                setResult({ score: data.score ?? 0, result: passed ? 'PASS' : 'FAIL', feedback: data.feedback })
                setModalStep('result')
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    alert(`채점 실패: ${err.response?.status} / ${JSON.stringify(err.response?.data ?? {})}`)
                }
                setModalStep('upload')
            }
        }
    }

    const getDefaultMissionImage = (theme: string) => {
        const imageMap: Record<string, string> = {
            '3분할': '/images/samples/3분할.png',
            '중앙배치': '/images/samples/중앙배치.png',
            '중앙 배치': '/images/samples/중앙배치.png',
            '대칭': '/images/samples/대칭.png',
            '여백': '/images/samples/여백.png',
            '소실점': '/images/samples/소실점.png',
            '야경': '/images/samples/야경.png',
            '윤슬': '/images/samples/윤슬.jpg',
            '인물': '/images/samples/인물.jpg',
            '꽃': '/images/samples/꽃.jpg',
            '고양이': '/images/samples/고양이.png',
            '건축물': '/images/samples/건축물.png',
            '골든아워': '/images/samples/골든아워.png',
            '로우앵글': '/images/samples/로우앵글.png',
            '리딩라인': '/images/samples/리딩라인.png',
            '반영': '/images/samples/반영.png',
            '패턴': '/images/samples/패턴.png',
            '프레이밍': '/images/samples/프레이밍.png',
            '하늘': '/images/samples/하늘.png',
            '하이앵글': '/images/samples/하이앵글.png',
            '흑백': '/images/samples/흑백.png',
        }

        return imageMap[theme] || '/images/mission-illustration.png'
    }

    const sampleImg = detail?.sampleUrl ?? detail?.sample_url ?? undefined
    const modalSampleImg = sampleImg
    const passScore = detail?.passScore ?? detail?.pass_score ?? null

    return (
        <div className="mission-container">
            <main className="step-main-content">
                <aside className="step-sidebar">
                    <div className="graphics-placeholder"></div>
                </aside>

                <section className="mission-grid-section">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
                            불러오는 중...
                        </div>
                    ) : (
                        cards.map(card => (
                            <div
                                key={card.missionId}
                                className={`mission-card ${card.color === 'purple' ? 'card-purple' : 'card-green'}`}
                            >
                                <div className="mission-card-header">
                                    <div>
                                        <h3 className="mission-card-title">{card.theme}</h3>
                                        <span className="photo-level-badge">
                                            {PHOTO_LEVEL_LABEL[card.level]} · {PHOTO_LEVEL_POINT[card.level]}p
                                        </span>
                                    </div>
                                    <div className="mission-card-right">
                                        <button
                                            className={`mission-action-btn ${card.color === 'purple' ? 'btn-purple' : 'btn-green'}`}
                                            onClick={() => openModal(card)}
                                        >
                                            {card.state === 'COMPLETED' ? '다시 도전' : '시작'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mission-card-image-box">
                                    <img src={card.sampleUrl || '/images/mission-illustration.png'} alt={card.theme} />
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            {selectedCard && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {modalStep === 'result' ? '채점 결과' : selectedCard.theme}
                        </h2>

                        {(detailLoading || modalStep === 'loading') && (
                            <div className="modal-loading-area">
                                <div className="spinner"></div>
                                <p>{detailLoading ? '미션 불러오는 중...' : '채점 중...'}</p>
                            </div>
                        )}

                        {!detailLoading && modalStep !== 'loading' && (
                            <>
                                <div className="modal-body">
                                    <div className="modal-left">
                                        {modalStep === 'desc' && (
                                            <img
                                                src={modalSampleImg || getDefaultMissionImage(selectedCard.theme)}
                                                alt={selectedCard.theme}
                                                className="modal-image"
                                            />
                                        )}
                                        {modalStep === 'upload' && (
                                            <>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputRef}
                                                    style={{ display: 'none' }}
                                                    onChange={handleFileChange}
                                                />
                                                {previewImage ? (
                                                    <div className="preview-container" onClick={() => fileInputRef.current?.click()}>
                                                        <img src={previewImage} alt="미리보기" className="modal-image preview-img" />
                                                        <div className="preview-overlay">사진 다시 고르기</div>
                                                    </div>
                                                ) : (
                                                    <div className="modal-upload-area" onClick={() => fileInputRef.current?.click()}>
                                                        <span className="upload-icon">↑</span>
                                                        <p>파일을 선택하거나<br />여기로 끌어다 놓으세요</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {modalStep === 'result' && previewImage && (
                                            <img src={previewImage} alt="제출한 사진" className="modal-image result-img" />
                                        )}
                                    </div>

                                    <div className="modal-right">
                                        {(modalStep === 'desc' || modalStep === 'upload') && (
                                            <>
                                                {detail?.theme && (
                                                    <p className="photo-theme-label">#{detail.theme}</p>
                                                )}
                                                {detail?.content && (
                                                    <p className="photo-content-text">{detail.content}</p>
                                                )}
                                                {detail?.guide && (
                                                    <p className="photo-guide-text">{detail.guide}</p>
                                                )}
                                                {passScore && (
                                                    <p className="pass-score-hint">합격 기준: {passScore}점 이상</p>
                                                )}
                                            </>
                                        )}
                                        {modalStep === 'result' && result && (
                                            <div className="result-content">
                                                <div className="score-bar-container">
                                                    <div className="score-bar-fill" style={{ width: `${result.score}%` }}>
                                                        <span className="score-text">{result.score}점</span>
                                                    </div>
                                                </div>
                                                {result.result && (
                                                    <p className={`result-verdict ${result.result === 'PASS' ? 'verdict-pass' : 'verdict-fail'}`}>
                                                        {result.result === 'PASS' ? '✓ PASS' : '✗ FAIL'}
                                                        {passScore && ` (기준: ${passScore}점)`}
                                                    </p>
                                                )}
                                                {result.result === 'PASS' && !wasAlreadyCompleted && (
                                                    <p className="result-xp-gained">
                                                        +{PHOTO_LEVEL_POINT[selectedCard!.level] ?? 0} XP 획득!
                                                    </p>
                                                )}
                                                {result.feedback && (
                                                    <p className="result-feedback">{result.feedback}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    {modalStep === 'result' ? (
                                        <>
                                            <button className="btn-cancel" onClick={() => setModalStep('upload')}>다른 사진 제출</button>
                                            <button className="btn-submit" onClick={closeModal}>돌아가기</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-cancel" onClick={closeModal}>다른 주제 고르기</button>
                                            <button className="btn-submit" onClick={handleSubmitClick}>
                                                {modalStep === 'desc' ? '사진 제출하기' : '제출'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
