import './StudyStep.css'

type Curriculum = {
    id: number
    title: string
    desc: string
    level: string
    status: 'start' | 'done'
}

export default function StudyStep() {
    // 임시문제
    const curriculum: Curriculum[] = [
        { id: 1, title: '구도의 기초', desc: '삼분할 법칙과 황금비율', level: '레벨 1', status: 'start' },
        { id: 2, title: '빛과 노출', desc: '조리개, 셔터속도, ISO', level: '레벨 1', status: 'start' },
        { id: 3, title: '색상과 화이트 밸런스', desc: '색온도와 분위기 만들기', level: '레벨 2', status: 'start' },
        { id: 4, title: '인물사진', desc: '포즈와 조명 기법', level: '레벨 2', status: 'start' },
        { id: 5, title: '풍경사진', desc: '자연을 담는 방법', level: '레벨 3', status: 'start' },
    ]

    return (
        <div className="step-container">
            {/* 2. 메인 콘텐츠 영역 (좌측 꾸밈 영역 / 우측 리스트 영역) */}
            <main className="step-main-content">
                {/* 왼쪽: 세로선과 추상 도형들 들어갈 자리 */}
                <aside className="step-sidebar">
                    <div className="graphics-placeholder">
                        {/* <img src="/images/step-graphics.png" alt="꾸밈 요소" /> */}
                    </div>
                </aside>

                {/* 오른쪽: 커리큘럼 카드 리스트 */}
                <section className="step-list-section">
                    {curriculum.map((item) => (
                        <div
                            key={item.id}
                            className={`step-card ${
                                item.status === 'done' ? 'card-done' : 'card-start'
                            }`}
                        >
                            <div className="step-card-info">
                                <h3 className="step-card-title">{item.title}</h3>
                                <p className="step-card-desc">{item.desc}</p>
                                <div className="step-card-level">
                  <span
                      className={`level-dot ${
                          item.status === 'done' ? 'dot-done' : 'dot-start'
                      }`}
                  ></span>
                                    {item.level}
                                </div>
                            </div>

                            <button
                                className={`step-action-btn ${
                                    item.status === 'done' ? 'btn-done' : 'btn-start'
                                }`}
                            >
                                {item.status === 'done' ? '완료' : '시작'}
                            </button>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}