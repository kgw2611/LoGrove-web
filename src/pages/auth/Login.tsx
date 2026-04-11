import { useState, type FormEvent, type ChangeEvent } from 'react' // 🔥 type 키워드 추가!
import { Link, useNavigate } from 'react-router-dom'
import '../home/Home.css' // 상단바 디자인 가져오기
import './Auth.css' // 로그인/회원가입 디자인 가져오기

export default function Login() {
    const navigate = useNavigate()

    // 1️⃣ 입력값 상태 관리
    const [userId, setUserId] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    // 2️⃣ 로그인 폼 제출 함수
    const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // 3️⃣ 브라우저의 비밀 수첩(localStorage)에서 가입된 유저 정보 꺼내오기!
        const savedUserString = localStorage.getItem('user_db')

        if (!savedUserString) {
            setErrorMessage('가입된 정보가 없습니다. 회원가입을 먼저 진행해주세요.')
            return
        }

        const savedUser: {
            userId: string
            password: string
            name: string
        } = JSON.parse(savedUserString)

        // 4️⃣ 내가 방금 입력한 정보와 수첩에 적힌 정보 대조하기
        if (savedUser.userId === userId && savedUser.password === password) {
            // ✅ 로그인 성공!
            setErrorMessage('')
            alert(`${savedUser.name}님, 환영합니다!`)

            // 🔥 앱 전체가 이 사람이 로그인했다는 걸 알 수 있게 도장 찍어두기
            localStorage.setItem('isLoggedIn', 'true')

            // 홈 화면으로 이동 후, 헤더를 업데이트 하기 위해 새로고침
            navigate('/')
            window.location.reload()
        } else {
            // ❌ 로그인 실패
            setErrorMessage('아이디 또는 비밀번호가 일치하지 않습니다.')
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Please login to continue</p>

                <div className="social-login">
                    <button className="social-btn btn-google">G</button>
                    <button className="social-btn btn-apple"></button>
                    <button className="social-btn btn-naver">N</button>
                    <button className="social-btn btn-kakao">TALK</button>
                </div>

                <div className="divider">또는</div>

                {/* 🔥 폼에 onSubmit 연결 */}
                <form className="auth-form" onSubmit={handleLoginSubmit}>
                    <div className="input-group">
                        <label>아이디 또는 이메일 ID</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="필수 입력"
                            value={userId}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setUserId(e.target.value)
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="필수 입력"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value)
                            }
                        />
                    </div>

                    <div className="auth-options">
                        <label>
                            <input type="checkbox" /> 기억하기
                        </label>
                        <a href="#">비밀번호를 잊으셨나요?</a>
                    </div>

                    {/* 🔥 에러 메시지 출력 영역 */}
                    {errorMessage && (
                        <div
                            style={{
                                color: 'red',
                                fontSize: '13px',
                                marginTop: '10px',
                                textAlign: 'center',
                            }}
                        >
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        style={{ marginTop: '15px' }}
                    >
                        Log In
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        계정이 없으신가요? <Link to="/signup">회원가입하기</Link>
                    </div>
                    <div>
                        <a href="#">ID/비밀번호찾기</a>
                    </div>
                </div>
            </div>
        </div>
    )
}