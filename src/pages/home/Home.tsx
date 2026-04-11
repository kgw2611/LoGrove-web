import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
    const navigate = useNavigate()

    // 🔥 핵심: 무조건 false가 아니라, 로컬 스토리지에 'isLoggedIn' 도장이 있는지 확인합니다!
    // (setIsLoggedIn은 이 컴포넌트 내에서 쓰지 않으므로 에러 방지를 위해 지웠습니다!)
    const [isLoggedIn] = useState<boolean>(
        localStorage.getItem('isLoggedIn') === 'true'
    )

    // "시작하기" 버튼 클릭 시 작동하는 함수
    const handleStartClick = () => {
        if (isLoggedIn) {
            navigate('/study') // 로그인 O -> 학습 메인 페이지로!
        } else {
            navigate('/login') // 로그인 X -> 로그인 화면으로!
        }
    }

    return (
        <div className="home-container">
            {/* 2. 메인 히어로 섹션 */}
            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        빛을 담아,
                        <br />
                        당신의 숲을 기록하다
                    </h1>
                    <p className="hero-subtitle">Capture your forest in light</p>

                    <div className="cta-box">
            <span className="cta-text">
              나에게 딱 맞는 학습 방법이 궁금하다면?
            </span>
                        {/* 🔥 Link 대신 onClick 함수를 달아서 똑똑한 버튼으로 만들었습니다! */}
                        <button className="cta-btn" onClick={handleStartClick}>
                            시작하기 →
                        </button>
                    </div>
                </div>
            </main>

            {/* 3. 하단 카드 섹션 */}
            <section className="features-section">
                <div className="cards-container">
                    {/* 첫 번째 카드: 커뮤니티 */}
                    <Link
                        to="/community"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="feature-card card-orange">
                            <div className="card-badge badge-orange">소통</div>
                            <h3>사진 커뮤니티</h3>
                            <p>
                                다른 포토그래퍼들과 소통하고,
                                <br />
                                의견을 나누어 영감을 얻으세요
                            </p>
                            <div className="card-link">둘러보기 &rarr;</div>
                        </div>
                    </Link>

                    {/* 두 번째 카드: 사진 학습 */}
                    <Link
                        to="/study"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="feature-card card-green">
                            <div className="card-badge badge-green">핵심 학습</div>
                            <h3>사진 학습</h3>
                            <p>
                                오늘의 한 컷은 어땠나요?
                                <br />
                                가벼운 퀴즈로 사진을 익히고
                                <br />
                                AI가 분석해주는 내 사진을
                                <br />
                                확인해보세요
                            </p>
                            <div className="card-link link-bold">
                                학습 시작하기 &rarr;
                            </div>
                        </div>
                    </Link>

                    {/* 세 번째 카드: 갤러리 */}
                    <Link
                        to="/gallery"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="feature-card card-blue">
                            <div className="card-badge badge-blue">기록</div>
                            <h3>나의 갤러리</h3>
                            <p>
                                매일을 기록하고
                                <br />
                                당신의 숲을 울창하게 가꿔보세요
                                <br />
                                차곡차곡 쌓인 사진들이
                                <br />
                                아름다운 숲을 이룹니다
                            </p>
                            <div className="card-link">갤러리 가기 &rarr;</div>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    )
}