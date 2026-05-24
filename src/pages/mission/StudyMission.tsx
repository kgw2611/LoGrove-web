import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../shared/api/client'
import { getValidToken } from '../../shared/utils/auth'
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

    // 선택된 미션 ID 상태
    const [selectedId, setSelectedId] = useState<number | null>(null)

    useEffect(() => {
        if (!getValidToken()) {
            navigate('/login')
            return
        }

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

                // 데이터 불러온 후 첫 번째 미션을 기본 선택 상태로 세팅
                if (mapped.length > 0) {
                    setSelectedId(mapped[0].missionId)
                }
            })
            .catch(e => console.error('사진 미션 목록 불러오기 실패:', e))
            .finally(() => setLoading(false))
    }, [navigate])

    // 현재 선택된 미션 객체 찾기
    const selectedMission = cards.find(c => c.missionId === selectedId) || cards[0]

    return (
        <div className="mission-container">
            {/* 메인 콘텐츠 영역 (좌우 4:6 분할) */}
            <main className="roadmap-main-content">

                {/* 👈 좌측: 로드맵 컬럼 (비율 4 & 스크롤 고정 & 지그재그) */}
                <div className="roadmap-left-column">

                    {/* 뒤로가기 버튼 유지 (상단 고정) */}
                    <div className="sidebar-top-actions">
                        <button className="roadmap-back-btn" onClick={() => navigate('/study')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span>뒤로가기</span>
                        </button>
                    </div>

                    <aside className="roadmap-sidebar">
                        <div className="timeline-container">
                            {loading ? (
                                <div style={{ padding: '20px', color: '#999' }}>불러오는 중...</div>
                            ) : (
                                cards.map((card, index) => {
                                    const isActive = selectedId === card.missionId
                                    const isCompleted = card.state === 'COMPLETED'
                                    // 지그재그 클래스 부여! (홀수/짝수에 따라 오프셋)
                                    const zigzagClass = index % 2 === 0 ? 'zigzag-left' : 'zigzag-right';

                                    return (
                                        <div
                                            key={card.missionId}
                                            className={`timeline-node ${zigzagClass} ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedId(card.missionId)}
                                        >
                                            <div className={`node-hexagon ${isCompleted ? 'completed' : ''}`}>
                                                <div className="hexagon-inner">
                                                    <span className="node-number">{index + 1}</span>
                                                </div>
                                            </div>
                                            <span className={`node-title ${isActive ? 'bold' : ''}`}>
                                                {card.theme}
                                            </span>

                                            {/* 다음 노드로 이어지는 지그재그 점선 */}
                                            {index < cards.length - 1 && (
                                                <div className={`node-line ${zigzagClass} ${isCompleted ? 'completed' : ''}`} />
                                            )}

                                            {/* 현재 선택된 항목에 표시되는 우측 연결선 (지그재그 반영) */}
                                            {isActive && <div className={`active-connector ${zigzagClass}`} />}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </aside>
                </div>

                {/* 👉 우측: 선택된 미션 상세 카드 (비율 6, 스크롤 고정) */}
                <section className="roadmap-detail-section">
                    {selectedMission && (
                        <div className={`detail-card ${selectedMission.state === 'COMPLETED' ? 'border-purple' : 'border-green'}`}>
                            <div className="detail-body">

                                <h1 className="lesson-title">{selectedMission.theme}</h1>

                                {/* 뱃지와 XP 텍스트 나란히 배치 */}
                                <div className="lesson-info-row">
                                    <span className={`lesson-level-badge ${selectedMission.color === 'purple' ? 'purple' : 'green'}`}>
                                        {PHOTO_LEVEL_LABEL[selectedMission.level]}
                                    </span>
                                    <span className={`lesson-xp-badge ${selectedMission.color === 'purple' ? 'purple' : 'green'}`}>
                                         XP {PHOTO_LEVEL_POINT[selectedMission.level]}
                                    </span>
                                </div>

                                {/* 샘플 이미지 뷰어 (테이블 삭제, 크게 꽉 차게) */}
                                <div className="lesson-sample-image">
                                    <img src={selectedMission.sampleUrl || '/images/mission-illustration.png'} alt={selectedMission.theme} />
                                </div>

                                {/* 하단 시작 버튼 */}
                                <button
                                    className={`lesson-start-btn ${selectedMission.color === 'purple' ? 'btn-purple' : 'btn-green'}`}
                                    onClick={() => navigate(`/study/mission/${selectedMission.missionId}`)}
                                >
                                    {selectedMission.state === 'COMPLETED' ? '다시 도전' : '시작'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

            </main>
        </div>
    )
}