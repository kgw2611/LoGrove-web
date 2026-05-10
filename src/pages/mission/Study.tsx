import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import '../home/Home.css'
import './Study.css'

const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5500, 9000, 13300]

type UserGameInfo = {
    nickname: string
    level: number
    progress: number
}

export default function Study() {
    const [gameInfo, setGameInfo] = useState<UserGameInfo | null>(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) return

        axios.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                const data = res.data.data || res.data
                setGameInfo({
                    nickname: data.nickname || data.name || '',
                    level: typeof data.level === 'number' ? data.level : 1,
                    progress: typeof data.progress === 'number' ? data.progress : 0,
                })
            })
            .catch(() => {})
    }, [])

    const renderXpBar = () => {
        if (!gameInfo) return null
        const lv = gameInfo.level
        const prog = gameInfo.progress
        const maxProg = lv < LEVEL_THRESHOLDS.length
            ? LEVEL_THRESHOLDS[lv] - LEVEL_THRESHOLDS[lv - 1]
            : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2]
        const pct = Math.min(100, Math.round((prog / maxProg) * 100))

        return (
            <div className="study-user-info">
                <div className="study-user-row">
                    <span className="study-level-badge">Lv.{lv}</span>
                    <span className="study-nickname">{gameInfo.nickname}</span>
                </div>
                <div className="study-xp-bar-track">
                    <div className="study-xp-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="study-xp-text">{prog} / {maxProg} XP</span>
            </div>
        )
    }

    return (
        <div className="study-container">
            <main className="study-main-content">
                {renderXpBar()}

                <h1 className="study-title">
                    LoGrove, 어떤 방식으로 시작해볼까요?
                </h1>

                <div className="study-cards-wrapper">
                    <Link to="/study/step" className="study-card">
                        <h2 className="study-card-title">단계별 학습</h2>
                        <div className="study-card-image">
                            <img
                                src="/images/step-illustration.png"
                                alt="단계별 학습 캐릭터"
                                className="character-img"
                            />
                            <img
                                src="/images/step-illustration2.png"
                                alt="단계별 학습 바닥"
                                className="floor-img"
                            />
                        </div>
                    </Link>

                    <Link to="/study/mission" className="study-card">
                        <h2 className="study-card-title">사진 제출형 학습</h2>
                        <div className="study-card-image">
                            <img
                                src="/images/mission-illustration.png"
                                alt="사진 제출형 캐릭터"
                                className="character-img"
                            />
                            <img
                                src="/images/mission-illustration2.png"
                                alt="사진 제출형 바닥"
                                className="floor-img"
                            />
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    )
}
