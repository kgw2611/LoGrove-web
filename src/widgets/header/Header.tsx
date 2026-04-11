import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
    const navigate = useNavigate();

    // 무조건 false가 아니라, 로컬 스토리지에 'isLoggedIn' 도장이 있는지 확인합니다!
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(localStorage.getItem('isLoggedIn') === 'true');

    // "Get started" 버튼 클릭 시 작동하는 함수
    const handleStartClick = () => {
        if (isLoggedIn) {
            navigate('/study'); // 로그인 O -> 학습 페이지
        } else {
            navigate('/login'); // 로그인 X -> 로그인 페이지
        }
    };

    // 홈으로 이동하면서 새로고침 효과를 주는 함수
    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.href = '/'; // 완벽한 새로고침을 위해 a 태그 기본 동작 활용
    };

    // 🔥 대망의 로그아웃 함수!
    const handleLogout = () => {
        if (window.confirm('정말 로그아웃 하시겠습니까?')) {
            // 1. 로컬 스토리지에서 로그인 도장 지우기!
            localStorage.removeItem('isLoggedIn');

            // 2. 상태를 false로 변경
            setIsLoggedIn(false);

            // 3. 홈 화면으로 쫓아내고 새로고침
            alert('안전하게 로그아웃 되었습니다.');
            navigate('/');
            window.location.reload();
        }
    };

    return (
        <header className="navbar">
            <div className="navbar-inner">

                <div className="logo">
                    <a href="/" onClick={handleHomeClick} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/images/HeaderIcon.png" alt="LoGrove 로고" className="logo-icon-img" />
                        <span className="logo-text">LoGrove</span>
                    </a>
                </div>

                <nav className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/community">community ⌄</Link>
                    <Link to="/gallery">gallery ⌄</Link>
                    <Link to="/forum">forum</Link>
                </nav>

                <div className="nav-buttons">
                    {/* 🔥 로그인 상태에 따른 조건부 렌더링 (로그아웃 버튼 추가!) */}
                    {isLoggedIn ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Link to="/mypage">
                                <button className="login-btn">my page</button>
                            </Link>
                            {/* 새로 추가된 로그아웃 버튼 (회색빛으로 살짝 구분감 주기) */}
                            <button
                                className="login-btn"
                                onClick={handleLogout}
                                style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login">
                            <button className="login-btn">Login</button>
                        </Link>
                    )}

                    <button className="start-btn" onClick={handleStartClick}>
                        Get started →
                    </button>
                </div>

            </div>
        </header>
    );
}