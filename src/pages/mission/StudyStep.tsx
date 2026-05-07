import { useState, useEffect } from 'react'
import { apiClient } from '../../shared/api/client'
import './StudyStep.css'

type StairItem = {
    missionId?: number
    id?: number
    type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
    level: 'EASY' | 'NORMAL' | 'HARD'
    state?: 'LOCKED' | 'INCOMPLETE' | 'COMPLETED'
    point?: number
    question?: string
}

type MultipleDetail = {
    question?: string
    radio1?: string
    radio2?: string
    radio3?: string
    radio4?: string
    commentary?: string
    imageUrl?: string | null
}

type ShortDetail = {
    question?: string
    commentary?: string
    imageUrl?: string | null
}

type QuizResult = {
    isCorrect: boolean
    commentary: string
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
    const [missions, setMissions] = useState<StairItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<StairItem | null>(null)
    const [quizDetail, setQuizDetail] = useState<MultipleDetail | ShortDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
    const [shortAnswer, setShortAnswer] = useState('')
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        apiClient.get('/learning/stair')
            .then(res => setMissions(res.data.data || res.data || []))
            .catch(e => console.error('단계별 미션 목록 불러오기 실패:', e))
            .finally(() => setLoading(false))
    }, [])

    const openDetail = async (item: StairItem) => {
        const id = item.missionId ?? item.id ?? 0
        setSelected({ ...item, missionId: id })
        setQuizDetail(null)
        setSelectedChoice(null)
        setShortAnswer('')
        setQuizResult(null)
        setDetailLoading(true)
        try {
            const endpoint = item.type === 'MULTIPLE_CHOICE'
                ? `/learning/stair/${id}/multiple`
                : `/learning/stair/${id}/short`
            const res = await apiClient.get(endpoint)
            setQuizDetail(res.data.data || res.data || {})
        } catch (e) {
            console.error('문제 불러오기 실패:', e)
        } finally {
            setDetailLoading(false)
        }
    }

    const closeModal = () => {
        setSelected(null)
        setQuizDetail(null)
        setSelectedChoice(null)
        setShortAnswer('')
        setQuizResult(null)
        setSubmitting(false)
    }

    const handleSubmit = async () => {
        if (!selected || !quizDetail || submitting) return

        const missionId = selected.missionId!
        const submittedAnswer = selected.type === 'MULTIPLE_CHOICE'
            ? selectedChoice
            : shortAnswer.trim()

        if (!submittedAnswer) return

        setSubmitting(true)
        try {
            const endpoint = selected.type === 'MULTIPLE_CHOICE'
                ? `/learning/stair/${missionId}/multiple/submit`
                : `/learning/stair/${missionId}/short/submit`
            const res = await apiClient.post(endpoint, {
                missionId,
                submittedAnswer,
            })
            const isCorrect = res.data.data === true
            setQuizResult({
                isCorrect,
                commentary: quizDetail.commentary ?? '',
            })

            if (isCorrect) {
                const categoryLast = [9, 18, 27, 36]
                setMissions(prev => prev.map(m => {
                    const id = m.missionId ?? m.id
                    if (id === missionId) return { ...m, state: 'COMPLETED' }
                    if (id === missionId + 1 && !categoryLast.includes(missionId) && m.state === 'LOCKED') {
                        return { ...m, state: 'INCOMPLETE' }
                    }
                    return m
                }))
                setSelected(prev => prev ? { ...prev, state: 'COMPLETED' } : prev)
            }
        } catch (e) {
            console.error('답안 제출 실패:', e)
        } finally {
            setSubmitting(false)
        }
    }

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
                                    const titleText = item.question
                                        ? item.question.slice(0, 50) + (item.question.length > 50 ? '…' : '')
                                        : `미션 #${id}`
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
                                                onClick={() => !locked && openDetail(item)}
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

            {selected && (
                <div className="modal-overlay" onClick={quizResult ? closeModal : undefined}>
                    <div className="modal-box step-quiz-modal" onClick={e => e.stopPropagation()}>
                        <div className="quiz-modal-header">
                            <span className="modal-category-label">
                                {getCategoryFromId(selected.missionId!)}
                            </span>
                            <span className={`level-badge level-${LEVEL_CLASS[selected.level]}`}>
                                {LEVEL_LABEL[selected.level]} · {selected.point ?? ''}p
                            </span>
                        </div>

                        {detailLoading ? (
                            <div className="modal-loading-area">
                                <div className="spinner"></div>
                                <p>문제 불러오는 중...</p>
                            </div>
                        ) : quizDetail ? (
                            <div className="quiz-content">
                                {quizDetail.imageUrl && (
                                    <img className="quiz-image" src={quizDetail.imageUrl} alt="" />
                                )}
                                <p className="quiz-question">
                                    {(quizDetail as MultipleDetail | ShortDetail).question}
                                </p>
                                {selected.type === 'MULTIPLE_CHOICE' && (
                                    <ul className="quiz-choices">
                                        {(['radio1', 'radio2', 'radio3', 'radio4'] as const).map((key, i) => {
                                            const val = (quizDetail as MultipleDetail)[key]
                                            return val ? (
                                                <li key={key}>
                                                    <button
                                                        type="button"
                                                        className={`quiz-choice-item ${selectedChoice === val ? 'choice-selected' : ''}`}
                                                        onClick={() => setSelectedChoice(val)}
                                                        disabled={!!quizResult || submitting}
                                                    >
                                                        <span className="choice-num">{i + 1}</span>
                                                        <span>{val}</span>
                                                    </button>
                                                </li>
                                            ) : null
                                        })}
                                    </ul>
                                )}
                                {selected.type === 'SHORT_ANSWER' && (
                                    <input
                                        className="short-answer-input"
                                        value={shortAnswer}
                                        onChange={e => setShortAnswer(e.target.value)}
                                        placeholder="답을 입력하세요"
                                        disabled={!!quizResult || submitting}
                                    />
                                )}
                                {quizResult && (
                                    <div className="quiz-result">
                                        <p className={`quiz-result-title ${quizResult.isCorrect ? 'result-correct' : 'result-wrong'}`}>
                                            {quizResult.isCorrect ? `정답입니다! +${selected.point ?? 0}p` : '틀렸습니다'}
                                        </p>
                                        {quizResult.commentary && (
                                            <p className="quiz-commentary">{quizResult.commentary}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="quiz-error">문제를 불러오지 못했습니다.</p>
                        )}

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={closeModal}>닫기</button>
                            {quizDetail && !quizResult && !detailLoading && (
                                <button
                                    className="btn-submit"
                                    onClick={handleSubmit}
                                    disabled={
                                        submitting ||
                                        (selected.type === 'MULTIPLE_CHOICE' ? !selectedChoice : !shortAnswer.trim())
                                    }
                                >
                                    {submitting ? '제출 중...' : '제출'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
