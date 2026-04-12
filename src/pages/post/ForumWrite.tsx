import { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🔥 백엔드 통신용 axios
import '../home/Home.css';
import './CommunityWrite.css';

interface Toggles {
    comment: boolean;
    share: boolean;
    scrap: boolean;
    source: boolean;
}

export default function ForumWrite() {
    const navigate = useNavigate();

    // 입력 상태(State) 관리
    const [board, setBoard] = useState<string>(''); // 세부 카테고리 (Q&A, 정보공유)
    const [camera, setCamera] = useState<string>(''); // 카메라 브랜드
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');

    // 🔥 사진 파일 관리를 위한 상태 추가
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 토글 스위치
    const [toggles, setToggles] = useState<Toggles>({
        comment: true, share: true, scrap: true, source: true
    });

    const handleToggle = (key: keyof Toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 🔥 사진 첨부 기능
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 🔥 "등록" 버튼: 백엔드 서버로 전송
    const handleSubmit = async () => {
        if (!board) return alert('게시판 카테고리를 선택해주세요.');
        if (!camera) return alert('카메라 종류를 선택해주세요.');
        if (!title.trim()) return alert('제목을 입력해주세요.');
        if (!content.trim()) return alert('내용을 입력해주세요.');

        const formData = new FormData();

        // 🚨 포럼 글쓰기이므로 무조건 FORUM으로 고정!
        formData.append('boardType', 'FORUM');
        formData.append('title', title);
        formData.append('content', content);

        // 💡 팁: 백엔드에서 세부 카테고리(board)와 카메라(camera)를 태그(tagIds)로 받을지,
        // 아니면 다른 필드로 받을지 건우님과 확인이 필요합니다! 임시로 제목에 붙여서 보냅니다.
        // 나중에 건우님이 정해주시면 formData.append('어쩌구', board) 로 추가하세요!
        // formData.append('subCategory', board);
        // formData.append('cameraBrand', camera);

        if (imageFile) {
            formData.append('images', imageFile); // 건우님 컨트롤러에 맞춤
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            const response = await axios.post('/api/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                alert('포럼 게시글이 성공적으로 등록되었습니다!');
                navigate('/forum');
            }
        } catch (error) {
            console.error('게시글 등록 실패:', error);
            alert('글 작성에 실패했습니다. (네트워크 탭을 확인해주세요)');
        }
    };

    return (
        <div className="write-container">
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

            <div className="write-content">
                <main className="write-main">
                    <div className="editor-top">
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <select
                                className="board-select"
                                style={{ flex: 1 }}
                                value={board}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setBoard(e.target.value)}
                            >
                                <option value="">게시판을 선택해 주세요</option>
                                <option value="Q&A">Q&A (질문/답변)</option>
                                <option value="정보공유">정보공유</option>
                            </select>

                            <select
                                className="board-select"
                                style={{ flex: 1 }}
                                value={camera}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCamera(e.target.value)}
                            >
                                <option value="">카메라 종류를 선택해 주세요</option>
                                <option value="Canon">Canon</option>
                                <option value="Sony">Sony</option>
                                <option value="Leica">Leica</option>
                                <option value="Film">Film</option>
                                <option value="Fujifilm">Fujifilm</option>
                                <option value="Hasselblad">Hasselblad</option>
                                <option value="Olympus">Olympus</option>
                                <option value="Panasonic">Panasonic</option>
                                <option value="기타(etc)">기타(etc)</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            className="title-input"
                            placeholder="제목을 입력해 주세요"
                            value={title}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="editor-toolbar">
                        <div className="toolbar-icons">
                            {/* 🔥 숨겨진 파일 인풋 & 버튼 연결 */}
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

                    {/* 본문 및 이미지 미리보기 */}
                    <div className="textarea-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
                        <textarea
                            className="content-textarea"
                            placeholder="내용을 입력하세요"
                            value={content}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            style={{ flex: 1, border: 'none', resize: 'none', outline: 'none', minHeight: '300px' }}
                        ></textarea>

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