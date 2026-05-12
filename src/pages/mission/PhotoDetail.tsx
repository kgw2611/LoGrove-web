import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { apiClient } from '../../shared/api/client'
import './StudyMission.css'

const PHOTO_LEVEL_POINT: Record<number, number> = { 0: 200, 1: 300, 2: 500 }

type PhotoCard = {
    missionId: number
    theme: string
    level: number
    state?: 'INCOMPLETE' | 'COMPLETED'
    sampleUrl?: string
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

export default function PhotoDetail() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const missionId = Number(id)

    const [card, setCard] = useState<PhotoCard | null>(null)
    const [detail, setDetail] = useState<PhotoDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState<'desc' | 'upload' | 'loading' | 'result'>('desc')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [result, setResult] = useState<GradingResult | null>(null)
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchDetail = async () => {
            if (!Number.isFinite(missionId)) {
                navigate('/study/mission', { replace: true })
                return
            }

            setLoading(true)
            try {
                const [listRes, detailRes] = await Promise.all([
                    apiClient.get('/learning/photo'),
                    apiClient.get(`/learning/${missionId}/photo`),
                ])
                const list: Record<string, unknown>[] = listRes.data.data || listRes.data || []
                const item = list.find(m => (m.missionId ?? m.id) === missionId)

                if (!item) {
                    navigate('/study/mission', { replace: true })
                    return
                }

                const normalized: PhotoCard = {
                    missionId,
                    theme: (item.title ?? `사진 미션 ${missionId}`) as string,
                    level: (item.level ?? 0) as number,
                    state: item.state as 'INCOMPLETE' | 'COMPLETED' | undefined,
                    sampleUrl: (item.sampleUrl ?? item.sample_url) as string | undefined,
                }
                setCard(normalized)
                setWasAlreadyCompleted(normalized.state === 'COMPLETED')
                setDetail(detailRes.data.data || detailRes.data || {})
            } catch (e) {
                console.error('사진 미션 상세 불러오기 실패:', e)
            } finally {
                setLoading(false)
            }
        }

        void fetchDetail()
    }, [missionId, navigate])

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
        if (step === 'desc') {
            setStep('upload')
            return
        }

        if (step !== 'upload') return
        if (!imageFile) {
            alert('사진을 먼저 첨부해 주세요!')
            return
        }

        const token = localStorage.getItem('access_token')
        if (!token) {
            alert('로그인이 필요한 서비스입니다.')
            navigate('/login')
            return
        }

        setStep('loading')
        const formData = new FormData()
        formData.append('file', imageFile)
        try {
            const res = await apiClient.post(`/learning/${missionId}/photo/submit`, formData)
            const data = res.data.data || res.data
            const passed = data.isSuccess ?? (data.result === 'PASS')
            setResult({ score: data.score ?? 0, result: passed ? 'PASS' : 'FAIL', feedback: data.feedback })
            if (passed) {
                setCard(prev => prev ? { ...prev, state: 'COMPLETED' } : prev)
            }
            setStep('result')
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(`채점 실패: ${err.response?.status} / ${JSON.stringify(err.response?.data ?? {})}`)
            }
            setStep('upload')
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
    const passScore = detail?.passScore ?? detail?.pass_score ?? null

    return (
        <div className="mission-container">
            <main className="mission-detail-page">
                <button className="mission-back-btn" onClick={() => navigate('/study/mission')}>
                    목록으로
                </button>

                <div className="modal-box mission-page-panel">
                    <h2 className="modal-title">
                        {step === 'result' ? '채점 결과' : card?.theme ?? '사진 미션'}
                    </h2>

                    {(loading || step === 'loading') && (
                        <div className="modal-loading-area">
                            <div className="spinner"></div>
                            <p>{loading ? '미션 불러오는 중...' : '채점 중...'}</p>
                        </div>
                    )}

                    {!loading && step !== 'loading' && card && (
                        <>
                            <div className="modal-body">
                                <div className="modal-left">
                                    {step === 'desc' && (
                                        <img
                                            src={sampleImg || card.sampleUrl || getDefaultMissionImage(card.theme)}
                                            alt={card.theme}
                                            className="modal-image"
                                        />
                                    )}
                                    {step === 'upload' && (
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
                                    {step === 'result' && previewImage && (
                                        <img src={previewImage} alt="제출한 사진" className="modal-image result-img" />
                                    )}
                                </div>

                                <div className="modal-right">
                                    {(step === 'desc' || step === 'upload') && (
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
                                    {step === 'result' && result && (
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
                                                    +{PHOTO_LEVEL_POINT[card.level] ?? 0} XP 획득!
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
                                {step === 'result' ? (
                                    <>
                                        <button className="btn-cancel" onClick={() => setStep('upload')}>다른 사진 제출</button>
                                        <button className="btn-submit" onClick={() => navigate('/study/mission')}>돌아가기</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-cancel" onClick={() => navigate('/study/mission')}>다른 주제 고르기</button>
                                        <button className="btn-submit" onClick={handleSubmitClick}>
                                            {step === 'desc' ? '사진 제출하기' : '제출'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
