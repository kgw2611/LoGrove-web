import { useState, useRef, useEffect, type ChangeEvent, type MouseEvent } from 'react'; // 🔥 type 키워드 사용 및 필요한 타입 추가
import { useNavigate } from 'react-router-dom';
import '../home/Home.css';
import './Gallery.css';
import './GalleryWrite.css';

// 타입 정의
interface Toggles {
    comment: boolean;
    share: boolean;
}

interface GalleryPostType {
    id: number;
    author: string;
    title: string;
    description: string;
    src: string; // Base64 이미지 텍스트
    date: string;
    toggles: Toggles;
}

export default function GalleryWrite() {
    const navigate = useNavigate();

    // 토글 스위치 및 입력 상태 관리
    const [toggles, setToggles] = useState<Toggles>({ comment: false, share: false });
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [userName, setUserName] = useState<string>('유저');

    // 사진 관련 상태
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // 🔥 에러 방지를 위해 사용하지 않는 imageFile 상태는 제거했습니다.
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 로그인 정보 가져오기
    useEffect(() => {
        const savedUserString = localStorage.getItem('user_db');
        if (savedUserString) {
            const savedUser = JSON.parse(savedUserString);
            setUserName(savedUser.nickname || savedUser.name);
        }
    }, []);

    const handleToggle = (key: keyof Toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setImagePreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 🔥 갤러리 업로드 실행 함수!
    const handleSubmit = () => {
        if (!imagePreview) return alert('사진을 먼저 업로드해주세요.');
        if (!title.trim()) return alert('제목을 입력해주세요.');

        // 저장할 갤러리 게시글 데이터 조립
        const newGalleryPost: GalleryPostType = {
            id: Date.now(),
            author: userName,
            title: title,
            description: description,
            src: imagePreview, // 임시로 Base64 이미지 텍스트를 저장합니다
            date: new Date().toLocaleDateString(),
            toggles: toggles
        };

        // 로컬 스토리지 'gallery_posts'에 저장
        const savedPosts: GalleryPostType[] = JSON.parse(localStorage.getItem('gallery_posts') || '[]');
        localStorage.setItem('gallery_posts', JSON.stringify([newGalleryPost, ...savedPosts]));

        alert('갤러리에 성공적으로 업로드되었습니다!');
        navigate('/gallery'); // 갤러리 목록으로 튕겨냅니다!
    };

    return (
        <div className="gallery-write-container">
            <div className="gallery-sub-header" style={{ marginBottom: '20px' }}>
                <div className="search-bar-wrapper">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search for..." className="gallery-search-input" />
                </div>
                <div className="gallery-actions">
                    <div className="user-profile-dropdown">
                        <div className="avatar-circle">👤</div>
                        <span className="dropdown-arrow">⌄</span>
                    </div>
                </div>
            </div>

            <div className="gw-main-wrapper">
                <div className="gw-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <span className="gw-title">갤러리 글쓰기</span>
                </div>

                <div className="gw-content">
                    {/* 왼쪽: 이미지 업로드 */}
                    <div className="gw-left-upload">
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                        <div className="upload-box" onClick={handleImageClick} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: imagePreview ? '0' : '40px' }}>
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <button onClick={handleRemoveImage} style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
                                </>
                            ) : (
                                <>
                                    <div className="upload-icon">↑</div>
                                    <p>파일을 선택하거나<br />여기로 클릭하세요</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 입력 폼 */}
                    <div className="gw-right-form">
                        <div className="form-group">
                            <label>제목</label>
                            <input type="text" className="gray-input" placeholder="제목추가" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>설명</label>
                            <textarea className="gray-textarea" placeholder="자세한 설명을 추가하세요" value={description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}></textarea>
                        </div>
                        <div className="form-group tag-group">
                            <div className="tag-search-box">
                                <span className="search-icon">🔍</span>
                                <input type="text" placeholder="태그 목록 검색" className="tag-search-input" />
                            </div>
                            <div className="gray-box tag-display-box">
                                <span className="tag-count">태그된 주제(0)개</span>
                                <p className="tag-desc">태그 검색</p>
                            </div>
                            <button className="tag-recommend-btn">태그 추천</button>
                        </div>

                        <div className="form-toggles">
                            <div className="toggle-row">
                                <label className="switch"><input type="checkbox" checked={toggles.comment} onChange={() => handleToggle('comment')} /><span className="slider round"></span></label>
                                <span className="toggle-label">댓글달기 허용</span>
                            </div>
                            <div className="toggle-row">
                                <label className="switch"><input type="checkbox" checked={toggles.share} onChange={() => handleToggle('share')} /><span className="slider round"></span></label>
                                <span className="toggle-label">공유 허용</span>
                            </div>
                        </div>

                        {/* 🔥 대망의 업로드 버튼 추가! */}
                        <button
                            onClick={handleSubmit}
                            style={{ width: '100%', padding: '15px', marginTop: '30px', backgroundColor: '#8ce99a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                        >
                            게시하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}