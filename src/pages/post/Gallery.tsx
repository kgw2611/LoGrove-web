import { useState, useEffect, type MouseEvent } from 'react'; // 🔥 type 키워드 사용
import { Link } from 'react-router-dom';
import '../home/Home.css';
import './Gallery.css';

// 타입 정의
interface GalleryItemType {
    id: number | string;
    src: string;
    title: string;
    description?: string;
    author: string;
}

export default function Gallery() {
    // 🔥 사용하지 않는 setIsLoggedIn 제거 (TS6133 방지)
    const [isLoggedIn] = useState<boolean>(localStorage.getItem('isLoggedIn') === 'true');
    const [userName, setUserName] = useState<string>('');
    const [galleryItems, setGalleryItems] = useState<GalleryItemType[]>([]);

    // 🔥 클릭한 사진의 상세 정보를 담을 State (null이면 모달 닫힘, 데이터가 있으면 모달 열림)
    const [selectedPost, setSelectedPost] = useState<GalleryItemType | null>(null);

    useEffect(() => {
        if (isLoggedIn) {
            const savedUserString = localStorage.getItem('user_db');
            if (savedUserString) {
                const savedUser = JSON.parse(savedUserString);
                setUserName(savedUser.nickname || savedUser.name);
            }
        }

        const savedGallery: GalleryItemType[] = JSON.parse(localStorage.getItem('gallery_posts') || '[]');
        setGalleryItems(savedGallery);
    }, [isLoggedIn]);

    // 갤러리 사진 클릭 시 호출되는 함수
    const openModal = (item: GalleryItemType) => {
        setSelectedPost(item);
        document.body.style.overflow = 'hidden'; // 모달 떴을 때 뒷배경 스크롤 방지
    };

    // 모달 닫기 함수
    const closeModal = () => {
        setSelectedPost(null);
        document.body.style.overflow = 'auto'; // 스크롤 다시 허용
    };

    return (
        <div className="gallery-container">
            <div className="gallery-sub-header">
                <div className="search-bar-wrapper">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search for..." className="gallery-search-input" />
                </div>

                <div className="gallery-actions">
                    {isLoggedIn ? (
                        <Link to="/gallery/write">
                            <button className="gallery-write-btn">✎ writing</button>
                        </Link>
                    ) : (
                        <Link to="/login" style={{textDecoration: 'none'}}>
                            <button className="gallery-write-btn" style={{ backgroundColor: '#e5e5e5', color: '#666' }}>
                                로그인 하러 가기
                            </button>
                        </Link>
                    )}

                    <div className="user-profile-dropdown">
                        {isLoggedIn ? (
                            <div className="avatar-circle" style={{ overflow: 'hidden' }}>
                                <img
                                    src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=100&auto=format&fit=crop"
                                    alt="프로필"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    title={`${userName}님의 프로필`}
                                />
                            </div>
                        ) : (
                            <div className="avatar-circle">👤</div>
                        )}
                        <span className="dropdown-arrow">⌄</span>
                    </div>
                </div>
            </div>

            {galleryItems.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', color: '#999', width: '100%' }}>
                    <div style={{ fontSize: '50px', marginBottom: '15px' }}>📷</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#444', fontSize: '20px' }}>등록된 사진이 없습니다.</h3>
                    <p style={{ margin: 0, fontSize: '15px', color: '#888' }}>가장 먼저 멋진 사진을 공유해 보세요!</p>
                </div>
            ) : (
                <main className="masonry-grid">
                    {galleryItems.map((item) => (
                        // 🔥 1. 사진 카드를 클릭하면 openModal 함수가 실행됩니다!
                        <div className="masonry-item" key={item.id} onClick={() => openModal(item)} style={{ cursor: 'pointer' }}>
                            <img src={item.src} alt={item.title} className="masonry-img" />
                            <div className="masonry-info">
                                <span className="masonry-title">{item.title}</span>
                                <span className="masonry-more">...</span>
                            </div>
                        </div>
                    ))}
                </main>
            )}

            {/* 🔥 2. 상세 정보 모달(Modal) 창 렌더링 영역 */}
            {selectedPost && (
                <div className="gallery-modal-overlay" onClick={closeModal}>
                    {/* 모달 내부(흰 박스) 클릭 시 안 닫히게 이벤트 버블링 막기 */}
                    <div className="gallery-modal-card" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>

                        {/* 스크린샷과 똑같은 상단 메뉴바 */}
                        <div className="gallery-modal-topbar">
                            <div className="modal-top-left">
                                <button className="modal-icon-btn modal-close-btn" onClick={closeModal}>←</button>
                                <button className="modal-icon-btn">🤍 0</button>
                                <button className="modal-icon-btn">💬</button>
                                <button className="modal-icon-btn">📤</button>
                            </div>
                            <button style={{ backgroundColor: '#8ce99a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
                        </div>

                        {/* 큰 사진 미리보기 */}
                        <div className="gallery-modal-image-wrapper">
                            <img src={selectedPost.src} alt="Detail" />
                        </div>

                        {/* 하단 텍스트 정보 (제목, 내용, 유저) */}
                        <div className="gallery-modal-info">
                            <h2 className="modal-title">{selectedPost.title}</h2>
                            <p className="modal-desc">{selectedPost.description || '내용이 없습니다.'}</p>

                            <div className="modal-author-section">
                                <div className="modal-author-avatar">
                                    <img src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=100&auto=format&fit=crop" alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <span className="modal-author-name">{selectedPost.author}</span>
                            </div>

                            {/* 댓글 달기 UI (디자인만 먼저 준비했습니다) */}
                            <div className="modal-comments-section">
                                <div className="modal-comments-title">댓글 0개</div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div className="modal-author-avatar" style={{ width: '32px', height: '32px' }}>👤</div>
                                    <input type="text" className="modal-comment-input" placeholder="댓글 추가" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}