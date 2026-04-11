import { Link } from 'react-router-dom'
import '../home/Home.css'
import './Study.css'

export default function Study() {
    return (
        <div className="study-container">
            {/* 1. 상단 네비게이션 바 */}

            {/* 2. 학습 메인 콘텐츠 영역 */}
            <main className="study-main-content">
                <h1 className="study-title">
                    LoGrove, 어떤 방식으로 시작해볼까요?
                </h1>

                <div className="study-cards-wrapper">
                    {/* 첫 번째 카드: 단계별 학습 */}
                    <Link to="/study/step" className="study-card">
                        <h2 className="study-card-title">단계별 학습</h2>
                        <div className="study-card-image">
                            {/* 캐릭터 일러스트 (위에 둥둥) */}
                            <img
                                src="/images/step-illustration.png"
                                alt="단계별 학습 캐릭터"
                                className="character-img"
                            />
                            {/* 바닥 이미지 (아래에 쫙 깔림) */}
                            <img
                                src="/images/step-illustration2.png"
                                alt="단계별 학습 바닥"
                                className="floor-img"
                            />
                        </div>
                    </Link>

                    {/* 두 번째 카드: 사진 제출형 학습 */}
                    <Link to="/study/mission" className="study-card">
                        <h2 className="study-card-title">사진 제출형 학습</h2>
                        <div className="study-card-image">
                            {/* 카메라 일러스트 (위에 둥둥) */}
                            <img
                                src="/images/mission-illustration.png"
                                alt="사진 제출형 캐릭터"
                                className="character-img"
                            />
                            {/* 바닥 이미지 (아래에 쫙 깔림) */}
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