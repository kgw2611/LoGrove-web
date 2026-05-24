import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../shared/api/client'
import { getValidToken } from '../../shared/utils/auth'
import './StudyStep.css'

type StairItem = {
    missionId?: number
    id?: number
    type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
    level: 'EASY' | 'NORMAL' | 'HARD'
    state?: 'LOCKED' | 'INCOMPLETE' | 'COMPLETED'
    point?: number
    stairTitle?: string
    title?: string
    question?: string
}

const CATEGORIES = ['사진 이론', '보정법', '카메라 이론 및 조작', '구도법']

const getCategoryFromId = (id: number): string => {
    if (id <= 9) return '사진 이론'
    if (id <= 18) return '보정법'
    if (id <= 27) return '카메라 이론 및 조작'
    return '구도법'
}

export default function StudyStep() {
    const navigate = useNavigate()
    const [missions, setMissions] = useState<StairItem[]>([])
    const [loading, setLoading] = useState(true)

    const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0])
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // 카드들의 DOM 요소를 저장할 Ref
    const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

    useEffect(() => {
        if (!getValidToken()) {
            navigate('/login')
            return
        }

        apiClient.get('/learning/stair')
            .then(res => {
                const list = res.data.data || res.data || []
                setMissions(list)

                const initialFiltered = list
                    .map((m: StairItem) => ({ ...m, missionId: m.missionId ?? m.id ?? 0 }))
                    .filter((m: StairItem) => getCategoryFromId(m.missionId!) === CATEGORIES[0])
                    .sort((a: StairItem, b: StairItem) => a.missionId! - b.missionId!);

                if (initialFiltered.length > 0) {
                    setSelectedId(initialFiltered[0].missionId!)
                }
            })
            .catch(e => console.error('단계별 미션 목록 불러오기 실패:', e))
            .finally(() => setLoading(false))
    }, [navigate])

    const filteredMissions = missions
        .map(m => ({ ...m, missionId: m.missionId ?? m.id ?? 0 }))
        .filter(m => getCategoryFromId(m.missionId) === activeCategory)
        .sort((a, b) => a.missionId - b.missionId);

    // 카테고리 탭 클릭 시
    const handleCategoryClick = (cat: string) => {
        setActiveCategory(cat);
        // 왼쪽, 오른쪽 스크롤 모두 맨 위로 초기화
        const rightSection = document.querySelector('.roadmap-detail-section');
        if (rightSection) rightSection.scrollTo({ top: 0, behavior: 'smooth' });

        const newFiltered = missions
            .map(m => ({ ...m, missionId: m.missionId ?? m.id ?? 0 }))
            .filter(m => getCategoryFromId(m.missionId) === cat)
            .sort((a, b) => a.missionId - b.missionId);

        if (newFiltered.length > 0) {
            setSelectedId(newFiltered[0].missionId);
        } else {
            setSelectedId(null);
        }
    };

    // 로드맵 노드 클릭 시 실행되는 함수 (부드러운 스크롤 애니메이션)
    const handleNodeClick = (id: number, isLocked: boolean) => {
        if (isLocked) return;
        setSelectedId(id);

        cardRefs.current[id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    };

    return (
        <div className="step-container">
            <main className="roadmap-main-content">

                {/* 👈 좌측: 로드맵 컬럼 (비율 4 - Sticky) */}
                <div className="roadmap-left-column">
                    <div className="sidebar-top-actions">
                        <button className="roadmap-back-btn" onClick={() => navigate(-1)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span>뒤로가기</span>
                        </button>
                    </div>

                    <div className="category-selector">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <aside className="roadmap-sidebar">
                        <div className="timeline-container">
                            {loading ? (
                                <div style={{ padding: '20px', color: '#999' }}>불러오는 중...</div>
                            ) : filteredMissions.length === 0 ? (
                                <div style={{ padding: '20px', color: '#999' }}>해당 카테고리의 미션이 없습니다.</div>
                            ) : (
                                filteredMissions.map((card, index) => {
                                    const isActive = selectedId === card.missionId;
                                    const isCompleted = card.state === 'COMPLETED';
                                    const isLocked = card.state === 'LOCKED';
                                    const zigzagClass = index % 2 === 0 ? 'zigzag-left' : 'zigzag-right';
                                    const titleText = card.stairTitle ?? card.title ?? `미션 #${card.missionId}`;

                                    return (
                                        <div
                                            key={card.missionId}
                                            className={`timeline-node ${zigzagClass} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                            onClick={() => handleNodeClick(card.missionId, isLocked)}
                                        >
                                            <div className={`node-hexagon ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}>
                                                <div className="hexagon-inner">
                                                    <span className="node-number">{index + 1}</span>
                                                </div>
                                            </div>
                                            <span className={`node-title ${isActive ? 'bold' : ''}`}>
                                                {titleText.slice(0, 15)}{titleText.length > 15 ? '...' : ''}
                                            </span>

                                            {index < filteredMissions.length - 1 && (
                                                <div className={`node-line ${zigzagClass} ${isCompleted ? 'completed' : ''}`} />
                                            )}
                                            {isActive && <div className={`active-connector ${zigzagClass}`} />}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </aside>
                </div>

                {/* 👉 우측: 전체 미션 리스트 (비율 6 - Sticky & 자체 스크롤) */}
                <section className="roadmap-detail-section">
                    <div className="mission-list-container">
                        {filteredMissions.map((mission) => {
                            const isActive = selectedId === mission.missionId;
                            const isCompleted = mission.state === 'COMPLETED';
                            const isLocked = mission.state === 'LOCKED'; // 🔥 잠긴 상태 변수

                            // 🔥 상태에 따른 카드 테마 색상 결정 (완료: 보라, 잠김: 회색, 대기: 초록)
                            let cardThemeClass = 'border-green';
                            if (isCompleted) cardThemeClass = 'border-purple';
                            else if (isLocked) cardThemeClass = 'border-gray';

                            return (
                                <div
                                    key={mission.missionId}
                                    ref={(el) => { cardRefs.current[mission.missionId] = el; }}
                                    className={`detail-card ${cardThemeClass} ${isActive ? 'active-card' : ''}`}
                                >
                                    <div className="detail-body">

                                        {/* 제목과 뱃지들을 가로로 한 줄에 배치 */}
                                        <div className="lesson-header-row">
                                            <h1 className="lesson-title">
                                                {mission.stairTitle ?? mission.title ?? `미션 #${mission.missionId}`}
                                            </h1>
                                            <div className="lesson-badges">
                                                {/* 🔥 잠긴 미션일 때만 회색 자물쇠 뱃지 표시 */}
                                                {isLocked && (
                                                    <span className="lesson-locked-badge">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                        </svg>
                                                    </span>
                                                )}
                                                <span className="lesson-type-badge">
                                                    {mission.type === 'MULTIPLE_CHOICE' ? '객관식' : '단답형'}
                                                </span>
                                                {/* 🔥 잠긴 미션은 XP 뱃지도 회색 처리 */}
                                                <span className={`lesson-xp-badge ${isCompleted ? 'purple' : isLocked ? 'gray' : 'green'}`}>
                                                    XP {mission.point ?? 0}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            // 🔥 버튼 색상도 상태에 맞춰 변경 (잠김: 회색)
                                            className={`lesson-start-btn ${isCompleted ? 'btn-purple' : isLocked ? 'btn-gray' : 'btn-green'}`}
                                            onClick={() => navigate(`/study/step/${mission.missionId}`)}
                                            disabled={isLocked} // 🔥 잠긴 미션은 버튼 비활성화
                                        >
                                            {/* 🔥 버튼 텍스트 변경 (잠김: 🔒 아이콘) */}
                                            {isCompleted ? '다시 풀기' : isLocked ? '🔒' : '미션 풀기'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

            </main>
        </div>
    )
}