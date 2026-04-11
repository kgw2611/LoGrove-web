import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../home/Home.css'
import './Auth.css'
import { loginAPI } from '../../features/auth/api/authApi'

export default function Login() {
    const navigate = useNavigate()

    const [userId, setUserId] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!userId || !password) {
            setErrorMessage('아이디와 비밀번호를 입력해주세요.')
            return
        }

        try {
            const result = await loginAPI({ loginId: userId, loginPw: password })

            localStorage.setItem('access_token', result.token)
            localStorage.setItem('userId', String(result.userId))
            localStorage.setItem('nickname', result.nickname)

            setErrorMessage('')
            navigate('/')
            window.location.reload()
        } catch (error: any) {
            const errorMsg =
                error.response?.data?.message ||
                '아이디 또는 비밀번호가 일치하지 않습니다.'
            setErrorMessage(errorMsg)
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