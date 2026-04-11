import { useState, type ChangeEvent } from 'react'; // 🔥 type 키워드 사용 및 필요한 타입 추가
import { useNavigate } from 'react-router-dom'; // 🔥 사용하지 않는 Link 제거
import '../home/Home.css';
import './PostWrite.css';

// 타입 정의
interface Toggles {
    comment: boolean;
    share: boolean;
    scrap: boolean;
    source: boolean;
}

interface CommunityPostType {
    id: number;
    tag: string;
    title: string;
    content: string;
    author: string;
    date: string;
    views: number;
}

export default function PostWrite() {
    const navigate = useNavigate();

    // 🔥 1. 사용자가 입력할 제목, 내용, 카테고리를 저장할 상태(State)
    const [board, setBoard] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');

    // 우측 토글 스위치 상태 관리
    const [toggles, setToggles] = useState<Toggles>({
        comment: true,
        share: true,
        scrap: false,
        source: true
    });

    const handleToggle = (key: keyof Toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 🔥 2. "등록" 버튼을 눌렀을 때 실행될 함수
    const handleSubmit = () => {
        // 유효성 검사 (빈칸 체크)
        if (!board) {
            alert('게시판 카테고리를 선택해주세요.');
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

        // 로그인한 유저 정보 가져오기 (작성자 이름용)
        const savedUserString = localStorage.getItem('user_db');
        const authorName: string = savedUserString ? JSON.parse(savedUserString).name : '익명';

        // 3. 저장할 새 게시글 데이터 만들기
        const newPost: CommunityPostType = {
            id: Date.now(),
            tag: board,
            title: title,
            content: content,
            author: authorName,
            date: new Date().toLocaleDateString(),
            views: 0
        };

        // 4. 기존 게시글 목록 가져오기
        const existingPosts: CommunityPostType[] = JSON.parse(localStorage.getItem('community_posts') || '[]');

        // 5. 새 게시글을 맨 앞에 추가해서 다시 저장하기
        const updatedPosts = [newPost, ...existingPosts];
        localStorage.setItem('community_posts', JSON.stringify(updatedPosts));

        alert('게시글이 성공적으로 등록되었습니다!');

        // 6. 글 작성이 끝났으니 커뮤니티 목록으로 돌아가기
        navigate('/community');
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
                        <select
                            className="board-select"
                            value={board}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setBoard(e.target.value)}
                        >
                            <option value="">게시판을 선택해 주세요</option>
                            <option value="일상">일상</option>
                            <option value="자유">자유</option>
                            <option value="사진">사진</option>
                            <option value="거래">거래</option>
                            <option value="유머">유머</option>
                            <option value="출사">출사</option>
                        </select>
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
                            {/* 🔥 strike 대신 del 태그를 사용하여 표준 준수! */}
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
                    <div className="setting-box gray-box">
                        <div className="setting-title">공개설정 ⌄</div>
                        <div className="setting-list">
                            <label><input type="radio" name="visibility" /> 멤버공개</label>
                            <label><input type="radio" name="visibility" defaultChecked /> 전체공개</label>
                        </div>
                    </div>

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