import { useState, useRef, type ChangeEvent } from 'react'
import axios from 'axios'
import './StudyMission.css'

type Mission = {
    id: number
    title: string
    level: string
    theme: 'green' | 'purple'
    img: string
    desc: string
}

// 🔥 채점 결과 타입 정의
type GradingResult = {
    score: number;
    feedback: string;
}

export default function StudyMission() {
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

    // 🔥 모달의 4가지 상태 관리: 'desc'(설명) -> 'upload'(첨부) -> 'loading'(채점중) -> 'result'(결과)
    const [modalStep, setModalStep] = useState<'desc' | 'upload' | 'loading' | 'result'>('desc')

    // 파일 업로드 관련 상태
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 채점 결과 상태
    const [result, setResult] = useState<GradingResult | null>(null)

    const missions: Mission[] = [
        { id: 1, title: '3분할', level: '레벨 1', theme: 'green', img: '/images/3divisions.png', desc: '3분할 구도는 사진을 찍는다면 기본적으로 알아야 할 구도법입니다. 중앙에만 피사체를 배치하는 사진 대신, 색다른 느낌을 줄 수 있습니다.\n\n당장 카메라에서 격자선을 켜고 사진을 찍어보세요.' },
        { id: 2, title: '황금비율', level: '레벨 1', theme: 'green', img: '/images/golden ratio.png', desc: '황금비율은 자연에서 발견되는 가장 안정적이고 아름다운 비율입니다. 피보나치 나선을 활용하여 피사체를 배치해보세요.' },
        { id: 3, title: '소실점', level: '레벨 1', theme: 'green', img: '/images/vanishing point.png', desc: '소실점 구도는 시선이 한 곳으로 모이게 하여 강한 원근감과 집중력을 만들어냅니다. 길이나 건축물을 찍을 때 유용합니다.' },
        { id: 4, title: '야경사진', level: '레벨 1', theme: 'green', img: '/images/night view.png', desc: '야경 사진은 빛의 흔적과 도시의 감성을 담아냅니다. 삼각대를 활용하고 노출 시간을 길게 설정하여 멋진 야경을 담아보세요.' },
    ]

    // 모달 열기
    const openModal = (mission: Mission) => {
        setSelectedMission(mission)
        setModalStep('desc')
        setImageFile(null)
        setPreviewImage(null)
        setResult(null)
    }

    const closeModal = () => {
        setSelectedMission(null)
    }

    // 🔥 1. 파일 선택 창 띄우기
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // 🔥 2. 파일이 선택되었을 때 미리보기 만들기
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // 🔥 3. 제출하기 버튼 클릭 (백엔드 API 연동)
    const handleSubmitClick = async () => {
        if (modalStep === 'desc') {
            setModalStep('upload') // 설명 모드면 업로드 모드로 전환
            return
        }

        if (modalStep === 'upload') {
            if (!imageFile) {
                alert('사진을 먼저 첨부해 주세요!')
                return
            }

            // 로딩 화면으로 전환
            setModalStep('loading')

            const formData = new FormData()
            formData.append('image', imageFile) // 건우님과 키값('image' 또는 'file' 등) 맞춰보세요!

            try {
                // 명세서에 적힌 POST /api/learning/{mission_id}/photo/submit 호출
                const response = await axios.post(`/api/learning/${selectedMission?.id}/photo/submit`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                // 서버에서 채점 결과를 받아왔다고 가정
                setResult({
                    score: response.data.score || 90, // 실제 데이터 구조에 맞게 변경하세요!
                    feedback: response.data.feedback || "너무 잘 찍으셨습니다!!!!!!"
                })
                setModalStep('result') // 결과 화면으로 전환

            } catch (error) {
                console.error("채점 실패:", error)
                // 🚨 백엔드 연결 전 테스트를 위한 가짜 결과 (나중에 지우세요!)
                setTimeout(() => {
                    setResult({ score: 90, feedback: "너무 잘 찍으셨습니다!!!!!!" })
                    setModalStep('result')
                }, 2000);
                // alert('채점 서버와 연결할 수 없습니다.')
                // setModalStep('upload')
            }
        }
    }

    return (
        <div className="mission-container">
            <main className="step-main-content">
                <aside className="step-sidebar">
                    <div className="graphics-placeholder"></div>
                </aside>

                <section className="mission-grid-section">
                    {missions.map((item) => (
                        <div key={item.id} className={`mission-card ${item.theme === 'purple' ? 'card-purple' : 'card-green'}`}>
                            <div className="mission-card-header">
                                <h3 className="mission-card-title">{item.title}</h3>
                                <div className="mission-card-right">
                                    <div className="mission-card-level">
                                        <span className={`level-dot ${item.theme === 'purple' ? 'dot-purple' : 'dot-green'}`}></span>
                                        {item.level}
                                    </div>
                                    <button className={`mission-action-btn ${item.theme === 'purple' ? 'btn-purple' : 'btn-green'}`} onClick={() => openModal(item)}>시작</button>
                                </div>
                            </div>
                            <div className="mission-card-image-box">
                                <img src={item.img} alt={item.title} />
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {/* 🔥 모달 영역 */}
            {selectedMission && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>

                        <h2 className="modal-title">
                            {modalStep === 'result' ? '채점 결과' : selectedMission.title}
                        </h2>

                        {/* ⏳ 로딩 중 화면 */}
                        {modalStep === 'loading' && (
                            <div className="modal-loading-area">
                                <div className="spinner"></div>
                                <p>채점 중...</p>
                            </div>
                        )}

                        {/* 📄 설명 & 업로드 & 결과 화면 */}
                        {modalStep !== 'loading' && (
                            <div className="modal-body">
                                <div className="modal-left">
                                    {modalStep === 'desc' && (
                                        <img src={selectedMission.img} alt={selectedMission.title} className="modal-image" />
                                    )}

                                    {modalStep === 'upload' && (
                                        <>
                                            {/* 숨겨진 파일 인풋 */}
                                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                                            {previewImage ? (
                                                <div className="preview-container" onClick={handleUploadClick}>
                                                    <img src={previewImage} alt="미리보기" className="modal-image preview-img" />
                                                    <div className="preview-overlay">사진 다시 고르기</div>
                                                </div>
                                            ) : (
                                                <div className="modal-upload-area" onClick={handleUploadClick}>
                                                    <span className="upload-icon">↑</span>
                                                    <p>파일을 선택하거나<br/>여기로 끌어다 놓으세요</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {modalStep === 'result' && previewImage && (
                                        <img src={previewImage} alt="제출한 사진" className="modal-image result-img" />
                                    )}
                                </div>

                                <div className="modal-right">
                                    {modalStep === 'desc' && selectedMission.desc.split('\n').map((line, idx) => <span key={idx}>{line}<br /></span>)}

                                    {modalStep === 'upload' && selectedMission.desc.split('\n').map((line, idx) => <span key={idx}>{line}<br /></span>)}

                                    {modalStep === 'result' && result && (
                                        <div className="result-content">
                                            <p className="result-username">숲속으로님의 사진 결과는...</p>
                                            <div className="score-bar-container">
                                                <div className="score-bar-fill" style={{ width: `${result.score}%` }}>
                                                    <span className="score-text">{result.score}점</span>
                                                </div>
                                            </div>
                                            <p className="result-feedback">{result.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 하단 버튼 영역 */}
                        {modalStep !== 'loading' && (
                            <div className="modal-footer">
                                {modalStep === 'result' ? (
                                    <>
                                        <button className="btn-cancel" onClick={() => setModalStep('upload')}>다른 사진 제출</button>
                                        <button className="btn-submit" onClick={closeModal}>돌아가기</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-cancel" onClick={closeModal}>다른 주제 고르기</button>
                                        <button className="btn-submit" onClick={handleSubmitClick}>사진 제출하기</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}