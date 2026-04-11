import { useState, type FormEvent, type ChangeEvent } from 'react' // 🔥 type 키워드 추가!
import { Link, useNavigate } from 'react-router-dom'
import '../home/Home.css'
import './Auth.css'
// 🔥 방금 만든 api 함수를 불러옵니다! (경로는 폴더 구조에 맞게 조절해주세요)
import { signupAPI } from '../../features/auth/api/authApi'

export default function Signup() {
    const navigate = useNavigate()

    const [userId, setUserId] = useState<string>('')
    const [nickname, setNickname] = useState<string>('')
    const [name, setName] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [passwordConfirm, setPasswordConfirm] = useState<string>('')
    const [email, setEmail] = useState<string>('')

    const [errorMessage, setErrorMessage] = useState<string>('')
    const [isIdChecked, setIsIdChecked] = useState<boolean>(false)
    const [isNicknameChecked, setIsNicknameChecked] = useState<boolean>(false)
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false)

    // (참고: 나중에 백엔드에 중복확인 API가 생기면 여기도 api 함수로 교체하면 됩니다!)
    const handleIdCheck = () => {
        if (!userId) return alert('아이디를 먼저 입력해주세요.')
        alert('사용 가능한 아이디입니다!')
        setIsIdChecked(true)
    }

    const handleNicknameCheck = () => {
        if (!nickname) return alert('닉네임을 먼저 입력해주세요.')
        alert('사용 가능한 닉네임입니다!')
        setIsNicknameChecked(true)
    }

    const handleEmailVerify = () => {
        if (!email) return alert('이메일을 먼저 입력해주세요.')
        alert('인증이 완료되었습니다!')
        setIsEmailVerified(true)
    }

    // 🔥 비동기 통신을 위해 async를 꼭 붙여줍니다!
    const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // 깐깐한 유효성 검사 유지
        if (!userId || !nickname || !name || !password || !passwordConfirm || !email) {
            setErrorMessage('모든 필수 항목(*)을 입력해주세요.')
            return
        }
        if (!isIdChecked) {
            setErrorMessage('아이디 중복확인을 진행해주세요.')
            return
        }
        if (!isNicknameChecked) {
            setErrorMessage('닉네임 중복확인을 진행해주세요.')
            return
        }
        if (!isEmailVerified) {
            setErrorMessage('이메일 인증을 진행해주세요.')
            return
        }
        if (password.length < 8) {
            setErrorMessage('비밀번호는 8자리 이상이어야 합니다.')
            return
        }
        if (password !== passwordConfirm) {
            setErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

        try {
            // 🔥 1. API 명세서(SignupRequest)에 맞춰서 데이터를 포장합니다.
            const reqData = {
                login_id: userId,
                password: password, // 🔥 기존 login_pw를 password로 변경!
                name: name,
                nickname: nickname,
                email: email,
            }

            // 🔥 2. 백엔드로 진짜 발사! (응답이 올 때까지 기다림)
            const result = await signupAPI(reqData)

            // 3. 성공 시 처리 (기존 로컬 스토리지 코드 삭제)
            setErrorMessage('')
            console.log('백엔드 가입 성공 응답:', result)
            alert(`${name}님, 회원가입이 완료되었습니다! 이제 로그인이 가능합니다.`)

            navigate('/login')
        } catch (error: any) {
            // 🔥 백엔드에서 에러를 뱉었을 때 (예: 서버 다운, 알 수 없는 에러 등)
            console.error('회원가입 에러:', error)

            // 백엔드가 에러 메시지를 예쁘게 담아 보내줬다면 그걸 띄우고, 아니면 기본 메시지!
            const errorMsg =
                error.response?.data?.message ||
                '회원가입에 실패했습니다. 서버 상태를 확인해주세요.'
            setErrorMessage(errorMsg)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <h1 className="auth-title">회원가입</h1>
                <p className="auth-subtitle" style={{ marginBottom: '20px' }}></p>

                <div className="social-login">
                    <button className="social-btn btn-google">G</button>
                    <button className="social-btn btn-apple"></button>
                    <button className="social-btn btn-naver">N</button>
                    <button className="social-btn btn-kakao">TALK</button>
                </div>

                <div className="divider">또는</div>

                <form className="auth-form" onSubmit={handleSignupSubmit}>
                    <div className="input-group">
                        <label>
                            아이디 <span>*</span>
                        </label>
                        <div className="input-with-btn">
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="아이디를 입력해주세요"
                                value={userId}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setUserId(e.target.value)
                                    setIsIdChecked(false)
                                }}
                            />
                            <button
                                type="button"
                                className="side-btn"
                                onClick={handleIdCheck}
                            >
                                중복확인
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>
                            닉네임 <span>*</span>
                        </label>
                        <div className="input-with-btn">
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="닉네임을 입력해주세요"
                                value={nickname}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setNickname(e.target.value)
                                    setIsNicknameChecked(false)
                                }}
                            />
                            <button
                                type="button"
                                className="side-btn"
                                onClick={handleNicknameCheck}
                            >
                                중복확인
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>
                            이름 <span>*</span>
                        </label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="이름을 입력해주세요"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setName(e.target.value)
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            비밀번호 <span>*</span>
                        </label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="비밀번호를 입력해주세요"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value)
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            비밀번호 확인 <span>*</span>
                        </label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="비밀번호를 다시 한번 입력해주세요"
                            value={passwordConfirm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setPasswordConfirm(e.target.value)
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            이메일 <span>*</span>
                        </label>
                        <div className="input-with-btn">
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="이메일을 입력해주세요"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setEmail(e.target.value)
                                    setIsEmailVerified(false)
                                }}
                            />
                            <button
                                type="button"
                                className="side-btn"
                                onClick={handleEmailVerify}
                            >
                                인증하기
                            </button>
                        </div>
                    </div>

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
                        회원가입
                    </button>
                </form>

                <div className="auth-footer">
                    <div>
                        이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}