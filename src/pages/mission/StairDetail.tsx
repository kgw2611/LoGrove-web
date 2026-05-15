import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../shared/api/client'
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

const LEVEL_LABEL: Record<string, string> = { EASY: '기초', NORMAL: '응용', HARD: '실전' }
const LEVEL_CLASS: Record<string, string> = { EASY: 'easy', NORMAL: 'normal', HARD: 'hard' }
const CATEGORY_LAST = new Set([9, 18, 27, 36])

const getCategoryFromId = (id: number): string => {
    if (id <= 9) return '사진 이론'
    if (id <= 18) return '보정법'
    if (id <= 27) return '카메라 이론 및 조작'
    return '구도법'
}

export default function StairDetail() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const missionId = Number(id)

    const [mission, setMission] = useState<StairItem | null>(null)
    const [quizDetail, setQuizDetail] = useState<MultipleDetail | ShortDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
    const [shortAnswer, setShortAnswer] = useState('')
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
    const nextMissionId = missionId + 1
    const hasNextMission = !CATEGORY_LAST.has(missionId) && nextMissionId <= 36

    useEffect(() => {
        const fetchDetail = async () => {
            if (!Number.isFinite(missionId)) {
                navigate('/study/step', { replace: true })
                return
            }

            setLoading(true)
            setQuizDetail(null)
            setSelectedChoice(null)
            setShortAnswer('')
            setQuizResult(null)
            try {
                const listRes = await apiClient.get('/learning/stair')
                const list: StairItem[] = listRes.data.data || listRes.data || []
                const item = list.find(m => (m.missionId ?? m.id) === missionId)

                if (!item || item.state === 'LOCKED') {
                    navigate('/study/step', { replace: true })
                    return
                }

                const normalized = { ...item, missionId }
                setMission(normalized)
                setWasAlreadyCompleted(item.state === 'COMPLETED')

                const endpoint = item.type === 'MULTIPLE_CHOICE'
                    ? `/learning/stair/${missionId}/multiple`
                    : `/learning/stair/${missionId}/short`
                const detailRes = await apiClient.get(endpoint)
                setQuizDetail(detailRes.data.data || detailRes.data || {})
            } catch (e) {
                console.error('문제 불러오기 실패:', e)
            } finally {
                setLoading(false)
            }
        }

        void fetchDetail()
    }, [missionId, navigate])

    const handleSubmit = async () => {
        if (!mission || !quizDetail || submitting) return

        const submittedAnswer = mission.type === 'MULTIPLE_CHOICE'
            ? selectedChoice
            : shortAnswer.trim()

        if (!submittedAnswer) return

        setSubmitting(true)
        try {
            const endpoint = mission.type === 'MULTIPLE_CHOICE'
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
                setMission(prev => prev ? { ...prev, state: 'COMPLETED' } : prev)
            }
        } catch (e) {
            console.error('답안 제출 실패:', e)
        } finally {
            setSubmitting(false)
        }
    }

    const handleRetryQuiz = () => {
        // Keep this page open and clear only the submitted answer/result.
        setQuizResult(null)
        setSelectedChoice(null)
        setShortAnswer('')
    }

    return (
        <div className="step-container">
            <main className="mission-detail-page">
                <button className="mission-back-btn" onClick={() => navigate('/study/step')}>
                    목록으로
                </button>

                <div className="modal-box step-quiz-modal mission-page-panel">
                    {loading ? (
                        <div className="modal-loading-area">
                            <div className="spinner"></div>
                            <p>문제 불러오는 중...</p>
                        </div>
                    ) : mission && quizDetail ? (
                        <>
                            <div className="quiz-modal-header">
                                <span className="modal-category-label">
                                    {getCategoryFromId(missionId)}
                                </span>
                                <span className={`level-badge level-${LEVEL_CLASS[mission.level]}`}>
                                    {LEVEL_LABEL[mission.level]} · {mission.point ?? ''}p
                                </span>
                            </div>

                            <div className="quiz-content">
                                {quizDetail.imageUrl && (
                                    <img className="quiz-image" src={quizDetail.imageUrl} alt="" />
                                )}
                                <p className="quiz-question">
                                    {(quizDetail as MultipleDetail | ShortDetail).question}
                                </p>
                                {mission.type === 'MULTIPLE_CHOICE' && (
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
                                {mission.type === 'SHORT_ANSWER' && (
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
                                            {quizResult.isCorrect
                                                ? (wasAlreadyCompleted ? '정답입니다!' : `정답입니다! +${mission.point ?? 0}p`)
                                                : '틀렸습니다'}
                                        </p>
                                        {quizResult.commentary && (
                                            <p className="quiz-commentary">{quizResult.commentary}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                {quizResult?.isCorrect && CATEGORY_LAST.has(missionId) && (
                                    <span className="category-complete-text">카테고리 완료</span>
                                )}
                                {!quizResult && (
                                    <button
                                        className="btn-submit"
                                        onClick={handleSubmit}
                                        disabled={
                                            submitting ||
                                            (mission.type === 'MULTIPLE_CHOICE' ? !selectedChoice : !shortAnswer.trim())
                                        }
                                    >
                                        {submitting ? '제출 중...' : '제출'}
                                    </button>
                                )}
                                {quizResult && !quizResult.isCorrect && (
                                    <button
                                        className="btn-submit"
                                        onClick={handleRetryQuiz}
                                    >
                                        다시 풀기
                                    </button>
                                )}
                                {quizResult?.isCorrect && hasNextMission && (
                                    <button
                                        className="btn-submit"
                                        onClick={() => navigate(`/study/step/${nextMissionId}`)}
                                    >
                                        다음 문제
                                    </button>
                                )}
                                {quizResult && (
                                    <button
                                        className="btn-cancel"
                                        onClick={() => navigate('/study/step')}
                                    >
                                        닫기
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="quiz-error">문제를 불러오지 못했습니다.</p>
                    )}
                </div>
            </main>
        </div>
    )
}
