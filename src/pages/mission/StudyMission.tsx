import './StudyMission.css'

type Mission = {
    id: number
    title: string
    level: string
    theme: 'green' | 'purple'
    img: string
}

export default function StudyMission() {
    // 임시문제
    const missions: Mission[] = [
        {
            id: 1,
            title: '3분할',
            level: '레벨 1',
            theme: 'green',
            img: 'https://picsum.photos/400/250?random=1',
        },
        {
            id: 2,
            title: '황금비율',
            level: '레벨 1',
            theme: 'green', // 👈 여기를 바꿨습니다!
            img: 'https://picsum.photos/400/250?random=2',
        },
        {
            id: 3,
            title: '소실점',
            level: '레벨 1',
            theme: 'green',
            img: 'https://picsum.photos/400/250?random=3',
        },
        {
            id: 4,
            title: '야경사진',
            level: '레벨 1',
            theme: 'green',
            img: 'https://picsum.photos/400/250?random=4',
        },
    ]

    return (
        <div className="mission-container">
            {/* 2. 메인 콘텐츠 영역 */}
            <main className="step-main-content">
                {/* 왼쪽: 세로선과 추상 도형들 */}
                <aside className="step-sidebar">
                    <div className="graphics-placeholder">
                        {/* 여기에 피그마에서 추출한 왼쪽 도형들 이미지를 넣으세요! */}
                    </div>
                </aside>

                {/* 오른쪽: 미션 카드 그리드 */}
                <section className="mission-grid-section">
                    {missions.map((item) => (
                        <div
                            key={item.id}
                            className={`mission-card ${
                                item.theme === 'purple' ? 'card-purple' : 'card-green'
                            }`}
                        >
                            <div className="mission-card-header">
                                <h3 className="mission-card-title">{item.title}</h3>

                                <div className="mission-card-right">
                                    <div className="mission-card-level">
                    <span
                        className={`level-dot ${
                            item.theme === 'purple' ? 'dot-purple' : 'dot-green'
                        }`}
                    ></span>
                                        {item.level}
                                    </div>
                                    <button
                                        className={`mission-action-btn ${
                                            item.theme === 'purple' ? 'btn-purple' : 'btn-green'
                                        }`}
                                    >
                                        시작
                                    </button>
                                </div>
                            </div>

                            <div className="mission-card-image-box">
                                <img src={item.img} alt={item.title} />
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}