import { useState, type ChangeEvent } from 'react'; // 🔥 type 키워드 사용 및 ChangeEvent 추가
import { useNavigate } from 'react-router-dom'; // 🔥 사용하지 않는 Link 제거
import '../home/Home.css';
import './PostWrite.css'; // 커뮤니티 글쓰기 디자인 완벽 재사용!

// 타입 정의
interface Toggles {
    comment: boolean;
    share: boolean;
    scrap: boolean;
    source: boolean;
}

interface ForumPostType {
    id: number;
    boardType: string;
    brand: string;
    title: string;
    content: string;
    author: string;
    date: string;
    views: number;
}

export default function ForumWrite() {
    const navigate = useNavigate();

    // 🔥 1. 입력 상태(State) 관리 (카메라 브랜드 추가!)
    const [board, setBoard] = useState<string>('');
    const [camera, setCamera] = useState<string>(''); // 카메라 브랜드 전용
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');

    // 4개의 토글 스위치 상태 관리
    const [toggles, setToggles] = useState<Toggles>({
        comment: true,
        share: true,
        scrap: true,
        source: true
    });

    const handleToggle = (key: keyof Toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 🔥 2. "등록" 버튼 클릭 함수
    const handleSubmit = () => {
        // 유효성 검사
        if (!board) {
            alert('게시판 카테고리를 선택해주세요.');
            return;
        }
        if (!camera) {
            alert('카메라 종류를 선택해주세요.');
            return;
        }
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        // 로그인한 유저 정보 가져오기
        const savedUserString = localStorage.getItem('user_db');
        const authorName: string = savedUserString ? JSON.parse(savedUserString).name : '익명';

        // 3. 포럼 전용 게시글 데이터 만들기
        const newPost: ForumPostType = {
            id: Date.now(),
            boardType: board, // Q&A 인지 정보공유인지
            brand: camera,    // 🔥 어느 카메라 브랜드인지 (포럼에서 가장 중요!)
            title: title,
            content: content,
            author: authorName,
            date: new Date().toLocaleDateString(),
            views: 0
        };

        // 4. 로컬 스토리지에서 'forum_posts' 가져오기 (커뮤니티와 다른 수첩을 씁니다!)
        const existingPosts: ForumPostType[] = JSON.parse(localStorage.getItem('forum_posts') || '[]');

        // 5. 저장
        const updatedPosts = [newPost, ...existingPosts];
        localStorage.setItem('forum_posts', JSON.stringify(updatedPosts));

        alert('포럼 게시글이 성공적으로 등록되었습니다!');

        // 6. 포럼 메인 화면으로 이동
        navigate('/forum');
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
                    {/* 🔥 등록 버튼에 handleSubmit 연결 */}
                    <button className="submit-post-btn" onClick={handleSubmit}>등록</button>
                </div>
            </div>

            {/* 메인 영역 */}
            <div className="write-content">

                {/* 왼쪽: 에디터 */}
                <main className="write-main">

                    {/* 게시판과 카메라 종류 드롭다운 */}
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

                    {/* 에디터 툴바 */}
                    <div className="editor-toolbar">
                        <div className="toolbar-icons">
                            <button>🖼️ 사진</button>
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
                            {/* 🔥 strike 태그를 del 태그로 변경했습니다! */}
                            <button><del>T</del></button>
                        </div>
                    </div>

                    <textarea
                        className="content-textarea"
                        placeholder="내용을 입력하세요"
                        value={content}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    ></textarea>

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
                    {/* 공개 설정 박스 */}
                    <div className="setting-box gray-box">
                        <div className="setting-title">공개설정 ⌄</div>
                        <div className="setting-list">
                            <label><input type="radio" name="visibility" /> 멤버공개</label>
                            <label><input type="radio" name="visibility" defaultChecked /> 전체공개</label>
                        </div>
                    </div>

                    {/* 토글 설정 박스 */}
                    <div className="setting-box gray-box">
                        <div className="toggle-row">
                            <span className="toggle-label">댓글달기 허용</span>
                            <label className="switch">
                                <input type="checkbox" checked={toggles.comment} onChange={() => handleToggle('comment')} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="toggle-row">
                            <span className="toggle-label">공유 허용</span>
                            <label className="switch">
                                <input type="checkbox" checked={toggles.share} onChange={() => handleToggle('share')} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="toggle-row">
                            <span className="toggle-label">스크랩 허용</span>
                            <label className="switch">
                                <input type="checkbox" checked={toggles.scrap} onChange={() => handleToggle('scrap')} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="toggle-row">
                            <span className="toggle-label">자동출처 사용</span>
                            <label className="switch">
                                <input type="checkbox" checked={toggles.source} onChange={() => handleToggle('source')} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}