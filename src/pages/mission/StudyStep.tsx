import { useState, useEffect } from 'react'
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
const LEVEL_LABEL: Record<string, string> = { EASY: '기초', NORMAL: '응용', HARD: '실전' }
const LEVEL_CLASS: Record<string, string> = { EASY: 'easy', NORMAL: 'normal', HARD: 'hard' }

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

    useEffect(() => {
        if (!getValidToken()) {
            navigate('/login')
            return
        }

        apiClient.get('/learning/stair')
            .then(res => setMissions(res.data.data || res.data || []))
            .catch(e => console.error('단계별 미션 목록 불러오기 실패:', e))
            .finally(() => setLoading(false))
    }, [navigate])

    const grouped: Record<string, StairItem[]> = {}
    CATEGORIES.forEach(c => { grouped[c] = [] })
    missions.forEach(m => {
        const id = m.missionId ?? m.id ?? 0
        grouped[getCategoryFromId(id)].push({ ...m, missionId: id })
    })

    return (
        <div className="step-container">
            <main className="step-main-content">
                <aside className="step-sidebar">
                    <div className="graphics-placeholder"></div>
                </aside>

                <section className="step-list-section">
                    {loading ? (
                        <div className="step-loading">불러오는 중...</div>
                    ) : (
                        CATEGORIES.map(cat => grouped[cat].length > 0 && (
                            <div key={cat} className="step-category-group">
                                <h3 className="step-category-title">{cat}</h3>
                                {grouped[cat].map(item => {
                                    const id = item.missionId!
                                    const done = item.state === 'COMPLETED'
                                    const locked = item.state === 'LOCKED'
                                    const titleText = item.stairTitle
                                        ?? item.title
                                        ?? (item.question
                                            ? item.question.slice(0, 50) + (item.question.length > 50 ? '…' : '')
                                        : `미션 #${id}`)
                                    const cardClass = done ? 'card-done' : locked ? 'card-locked' : 'card-start'
                                    return (
                                        <div key={id} className={`step-card ${cardClass}`}>
                                            <div className="step-card-info">
                                                <div className="step-card-meta">
                                                    <span className={`level-badge level-${LEVEL_CLASS[item.level]}`}>
                                                        {LEVEL_LABEL[item.level]}
                                                    </span>
                                                    <span className="quiz-type-badge">
                                                        {item.type === 'MULTIPLE_CHOICE' ? '객관식' : '단답형'}
                                                    </span>
                                                </div>
                                                <h3 className="step-card-title">{titleText}</h3>
                                                <div className="step-card-level">
                                                    <span className={`level-dot ${done ? 'dot-done' : locked ? 'dot-locked' : 'dot-start'}`}></span>
                                                    {item.point ?? ''}p
                                                </div>
                                            </div>
                                            <button
                                                className={`step-action-btn ${done ? 'btn-done' : locked ? 'btn-locked' : 'btn-start'}`}
                                                onClick={() => !locked && navigate(`/study/step/${id}`)}
                                                disabled={locked}
                                            >
                                                {done ? '다시 풀기' : locked ? '🔒' : '풀기'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        ))
                    )}                
                </section>
            </main>
        </div>
    )
}
