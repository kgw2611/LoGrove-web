import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValidToken } from '../../shared/utils/auth';
import CasualPhotoModal from './CasualPhotoModal';
import './CasualPhotoFloatingButton.css';

export default function CasualPhotoFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        if (!getValidToken()) {
            if (window.confirm('로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?')) {
                navigate('/login');
            }
            return;
        }

        setIsOpen(true);
    };

    return (
        <>
            <button
                type="button"
                className="casual-photo-fab"
                onClick={handleClick}
                aria-label="자유 사진 채점"
            >
                <CameraStarIcon />
                <span>사진 피드백</span>
            </button>
            {isOpen && <CasualPhotoModal onClose={() => setIsOpen(false)} />}
        </>
    );
}

function CameraStarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 8h3l2-2h6l2 2h3v11H4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
            <path
                d="M18 4l0.7 1.5L20 6l-1.3 0.5L18 8l-0.7-1.5L16 6l1.3-0.5z"
                fill="#ffd66b"
            />
        </svg>
    );
}
