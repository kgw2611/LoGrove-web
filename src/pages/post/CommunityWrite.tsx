import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🔥 백엔드 통신을 위한 axios 추가
import '../home/Home.css';
import './CommunityWrite.css';

// 타입 정의
interface Toggles {
    comment: boolean;
    share: boolean;
    scrap: boolean;
    source: boolean;
}

export default function CommunityWrite() {
    const navigate = useNavigate();

    // 입력 상태 관리
    const [board, setBoard] = useState<string>(''); // 카테고리 (일상, 자유 등)
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');

    // 🔥 1. 사진 파일 관리를 위한 상태 추가
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 우측 토글 스위치 상태 관리
    const [toggles, setToggles] = useState<Toggles>({
        comment: true, share: true, scrap: false, source: true
    });

    const handleToggle = (key: keyof Toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 🔥 2. 사진 첨부 기능
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file); // 진짜 파일 장전
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string); // 미리보기 화면 장전
            };
            reader.readAsDataURL(file);
        }
    };

    // 사진 취소 기능
    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 🔥 3. "등록" 버튼: 백엔드 서버로 찐 전송!
    const handleSubmit = async () => {
        if (!board) return alert('게시판 카테고리를 선택해주세요.');
        if (!title.trim()) return alert('제목을 입력해주세요.');
        if (!content.trim()) return alert('내용을 입력해주세요.');

        // 파일과 글자를 같이 보내는 FormData 상자 생성
        const formData = new FormData();

        // 🚨 이전에 우리가 찾아낸 정답! 커뮤니티 글쓰기이므로 무조건 COMMUNITY로 고정!
        formData.append('boardType', 'COMMUNITY');
        formData.append('title', title);
        formData.append('content', content);

        // 사진이 있으면 'images'라는 이름표로 추가 (건우님 컨트롤러에 맞춤)
        if (imageFile) {
            formData.append('images', imageFile);
        }

        try {
            // 내 신분증(토큰) 꺼내기
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            // POST /api/posts 로 전송!
            const response = await axios.post('/api/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                alert('게시글이 성공적으로 등록되었습니다!');
                navigate('/community');
            }
        } catch (error) {
            console.error('게시글 등록 실패:', error);
            alert('글 작성에 실패했습니다. 서버 상태나 로그인을 확인해주세요.');
        }
    };

    return (
        <div className="write-container">
            {/* 글쓰기 헤더 */}
            <div className="write-header-bar">
                <div className="write-header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <span className="write-header-title">LoGrove 글쓰기</span>
                </div>
                <div className="write-header-right">
                    <span className="temp-save">임시등록 <span className="temp-count">0</span></span>
                    <button className="submit-post-btn" onClick={handleSubmit}>등록</button>
                </div>
            </div>

            {/* 글쓰기 메인 영역 */}
            <div className="write-content">
                {/* 왼쪽: 에디터 영역 */}
                <main className="write-main">
                    <div className="editor-top">
                        <select className="board-select" value={board} onChange={(e: ChangeEvent<HTMLSelectElement>) => setBoard(e.target.value)}>
                            <option value="">게시판을 선택해 주세요</option>
                            <option value="일상">일상</option>
                            <option value="자유">자유</option>
                            <option value="사진">사진</option>
                            <option value="거래">거래</option>
                            <option value="유머">유머</option>
                            <option value="출사">출사</option>
                        </select>
                        <input type="text" className="title-input" placeholder="제목을 입력해 주세요" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
                    </div>

                    {/* 에디터 툴바 */}
                    <div className="editor-toolbar">
                        <div className="toolbar-icons">
                            {/* 🔥 4. 숨겨진 파일 인풋 & 버튼 연결 */}
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                            <button onClick={() => fileInputRef.current?.click()}>🖼️ 사진</button>

                            <button>🎥 동영상</button>
                            <button>🙂 이모티콘</button>
                            <button>🗺️ 장소</button>
                            <button>🔗 링크</button>
                            <button>📊 투표</button>
                        </div>
                        <div className="toolbar-text-options">
                            <select><option>본문</option></select>
                            <select><option>기본서체</option></select>
                            <select><option>15</option></select>
                            <div className="divider-vertical"></div>
                            <button><b>B</b></button>
                            <button><i>I</i></button>
                            <button><u>U</u></button>
                            <button><del>T</del></button>
                        </div>
                    </div>

                    {/* 본문 입력 및 이미지 미리보기 영역 */}
                    <div className="textarea-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
                        <textarea
                            className="content-textarea"
                            placeholder="내용을 입력하세요"
                            value={content}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            style={{ flex: 1, border: 'none', resize: 'none', outline: 'none', minHeight: '300px' }}
                        ></textarea>

                        {/* 🔥 5. 첨부된 사진 미리보기 창 */}
                        {previewImage && (
                            <div className="image-preview" style={{ position: 'relative', display: 'inline-block', marginTop: '20px', maxWidth: '300px' }}>
                                <img src={previewImage} alt="미리보기" style={{ width: '100%', borderRadius: '8px', border: '1px solid #eee' }} />
                                <button
                                    onClick={handleRemoveImage}
                                    style={{
                                        position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)',
                                        color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >✕</button>
                            </div>
                        )}
                    </div>

                    {/* 하단 태그 영역 */}
                    <div className="editor-bottom-tags">
                        <div className="tag-input-wrapper">
                            <span className="tag-count">태그된 주제(1)개</span>
                            <div className="tag-input-row">
                                <input type="text" placeholder="태그 검색" />
                                <span className="dropdown-arrow">⌄</span>
                            </div>
                        </div>
                        <div className="tag-chips-row">
                            <span className="tag-chip">풍경사진 ✕</span>
                            <button className="tag-recommend-btn">태그 추천</button>
                        </div>
                    </div>
                </main>

                {/* 오른쪽: 설정 사이드바 */}
                <aside className="write-sidebar">
                    <div className="setting-box gray-box">
                        <div className="setting-title">공개설정 ⌄</div>
                        <div className="setting-list">
                            <label><input type="radio" name="visibility" /> 멤버공개</label>
                            <label><input type="radio" name="visibility" defaultChecked /> 전체공개</label>
                        </div>
                    </div>

                    <div className="setting-box gray-box">
                        <div className="toggle-row"><span className="toggle-label">댓글달기 허용</span><label className="switch"><input type="checkbox" checked={toggles.comment} onChange={() => handleToggle('comment')} /><span className="slider round"></span></label></div>
                        <div className="toggle-row"><span className="toggle-label">공유 허용</span><label className="switch"><input type="checkbox" checked={toggles.share} onChange={() => handleToggle('share')} /><span className="slider round"></span></label></div>
                        <div className="toggle-row"><span className="toggle-label">스크랩 허용</span><label className="switch"><input type="checkbox" checked={toggles.scrap} onChange={() => handleToggle('scrap')} /><span className="slider round"></span></label></div>
                        <div className="toggle-row"><span className="toggle-label">자동출처 사용</span><label className="switch"><input type="checkbox" checked={toggles.source} onChange={() => handleToggle('source')} /><span className="slider round"></span></label></div>
                    </div>
                </aside>
            </div>
        </div>
    );
}