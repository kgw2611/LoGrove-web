import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { apiClient } from '../../shared/api/client'
import './StudyMission.css'

type Mission = {
    id: number
    theme: string
    color: 'green' | 'purple'
    img: string
    desc: string
}

type GradingResult = {
    score: number
    feedback: string
}

type MissionListItem = {
    id?: number
    missionId?: number
}

type MissionDetailItem = {
    theme?: string
    content?: string
    guide?: string
    sampleUrl?: string | null
    sample_url?: string | null
}

const getDefaultMissionImage = (theme?: string) => {
    switch (theme) {
        case '3분할':
            return '/images/3divisions.png'
        case '황금비율':
            return '/images/golden ratio.png'
        case '소실점':
            return '/images/vanishing point.png'
        case '야경사진':
            return '/images/night view.png'
        default:
            return '/images/mission-illustration.png'
    }
}

export default function StudyMission() {
    const navigate = useNavigate()

    const [missions, setMissions] = useState<Mission[]>([])
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
    const [modalStep, setModalStep] = useState<'desc' | 'upload' | 'loading' | 'result'>('desc')

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [result, setResult] = useState<GradingResult | null>(null)

    useEffect(() => {
        const fetchPhotoMissions = async () => {
            try {
                const listResponse = await apiClient.get('/api/learning/photo')
                const listData: MissionListItem[] = listResponse.data.data || listResponse.data || []

                const detailedMissions = await Promise.all(
                    listData.map(async (item, index) => {
                        const missionId = item.id ?? item.missionId ?? 0
                        const detailResponse = await apiClient.get(`/api/learning/${missionId}/photo`)
                        const detail: MissionDetailItem = detailResponse.data.data || detailResponse.data || {}

                        return {
                            id: missionId,
                            theme: detail.theme ?? `사진 미션 ${missionId}`,
                            color: index % 2 === 0 ? 'green' : 'purple',
                            img: getDefaultMissionImage(detail.theme),
                            desc: `${detail.content ?? ''}\n\n${detail.guide ?? ''}`.trim(),
                        } satisfies Mission
                    })
                )

                setMissions(detailedMissions)
            } catch (error) {
                console.error('사진 미션 목록 불러오기 실패:', error)
                alert('사진 미션 목록을 불러오지 못했습니다.')
            }
        }

        fetchPhotoMissions()
    }, [])

    const openModal = (mission: Mission) => {
        setSelectedMission(mission)
        setModalStep('desc')
        setImageFile(null)
        setPreviewImage(null)
        setResult(null)
    }

    const closeModal = () => {
        setSelectedMission(null)
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmitClick = async () => {
        if (modalStep === 'desc') {
            setModalStep('upload')
            return
        }

        if (modalStep === 'upload') {
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

            setModalStep('loading')

            const formData = new FormData()
            formData.append('file', imageFile)

            try {
                const response = await apiClient.post(
                    `/api/learning/${selectedMission?.id}/photo/submit`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                const serverData = response.data.data || response.data

                setResult({
                    score: serverData.score || 0,
                    feedback: serverData.feedback || '채점 완료되었습니다.',
                })
                setModalStep('result')
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    console.error('채점 실패:', error)
                    console.error('status:', error.response?.status)
                    console.error('data:', error.response?.data)
                    alert(`채점 실패: ${error.response?.status ?? 'unknown'} / ${JSON.stringify(error.response?.data ?? {})}`)
                } else {
                    console.error('채점 실패:', error)
                    alert('채점 실패: unknown')
                }
                setModalStep('upload')
            }
        }
    }

    return (
        <div className="mission-container">
            <main className="step-main-content">
                <aside className="step-sidebar">
                    <div className="graphics-placeholder"></div>
                </aside>

                <section className="mission-grid-section">
                    {missions.map((item) => (
                        <div key={item.id} className={`mission-card ${item.color === 'purple' ? 'card-purple' : 'card-green'}`}>
                            <div className="mission-card-header">
                                <h3 className="mission-card-title">{item.theme}</h3>
                                <div className="mission-card-right">
                                    <button
                                        className={`mission-action-btn ${item.color === 'purple' ? 'btn-purple' : 'btn-green'}`}
                                        onClick={() => openModal(item)}
                                    >
                                        시작
                                    </button>
                                </div>
                            </div>
                            <div className="mission-card-image-box">
                                <img src={item.img} alt={item.theme} />
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {selectedMission && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {modalStep === 'result' ? '채점 결과' : selectedMission.theme}
                        </h2>

                        {modalStep === 'loading' && (
                            <div className="modal-loading-area">
                                <div className="spinner"></div>
                                <p>채점 중...</p>
                            </div>
                        )}

                        {modalStep !== 'loading' && (
                            <div className="modal-body">
                                <div className="modal-left">
                                    {modalStep === 'desc' && (
                                        <img src={selectedMission.img} alt={selectedMission.theme} className="modal-image" />
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
                                                <div className="preview-container" onClick={handleUploadClick}>
                                                    <img src={previewImage} alt="미리보기" className="modal-image preview-img" />
                                                    <div className="preview-overlay">사진 다시 고르기</div>
                                                </div>
                                            ) : (
                                                <div className="modal-upload-area" onClick={handleUploadClick}>
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
                                    {modalStep === 'desc' && selectedMission.desc.split('\n').map((line, idx) => <span key={idx}>{line}<br /></span>)}
                                    {modalStep === 'upload' && selectedMission.desc.split('\n').map((line, idx) => <span key={idx}>{line}<br /></span>)}
                                    {modalStep === 'result' && result && (
                                        <div className="result-content">
                                            <p className="result-username">숲속으로님의 사진 결과는...</p>
                                            <div className="score-bar-container">
                                                <div className="score-bar-fill" style={{ width: `${result.score}%` }}>
                                                    <span className="score-text">{result.score}점</span>
                                                </div>
                                            </div>
                                            <p className="result-feedback">{result.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modalStep !== 'loading' && (
                            <div className="modal-footer">
                                {modalStep === 'result' ? (
                                    <>
                                        <button className="btn-cancel" onClick={() => setModalStep('upload')}>다른 사진 제출</button>
                                        <button className="btn-submit" onClick={closeModal}>돌아가기</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-cancel" onClick={closeModal}>다른 주제 고르기</button>
                                        <button className="btn-submit" onClick={handleSubmitClick}>사진 제출하기</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}