import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function StudyMission() {
    const navigate = useNavigate()
    const [cards, setCards] = useState<PhotoCard[]>([])
    const [loading, setLoading] = useState(true)

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
                                            onClick={() => navigate(`/study/mission/${card.missionId}`)}
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
        </div>
    )
}
