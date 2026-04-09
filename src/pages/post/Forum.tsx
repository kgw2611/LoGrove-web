import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../home/Home.css';
import './Community.css'; // 사이드바, 테이블 기본 스타일 재사용
import './Forum.css'; // 포럼 전용 스타일 (브랜드 그리드 등)

// 타입 정의
interface ReplyType {
    id?: number;
}

interface CommentType {
    postId: string;
    replies?: ReplyType[];
}

interface ForumPostType {
    id: number | string;
    brand: string;
    boardType: string;
    title: string;
    author: string;
    date: string;
    views: number;
}

export default function Forum() {
    const navigate = useNavigate();

    // 1. 현재 선택된 카메라 브랜드 상태 관리 (기본값: Canon)
    const [activeBrand, setActiveBrand] = useState<string>('Canon');

    // 🔥 게시글 목록을 담을 상태 추가 (빈 배열로 시작)
    const [boardList, setBoardList] = useState<ForumPostType[]>([]);

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('');

    // 🔥 1. 포럼 댓글 전체 목록을 담을 상태 추가!
    const [allComments, setAllComments] = useState<CommentType[]>([]);

    // 컴포넌트가 렌더링될 때 로컬 스토리지 확인
    useEffect(() => {
        // 로그인 상태 확인
        const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedInStatus);

        if (loggedInStatus) {
            const savedUserString = localStorage.getItem('user_db');
            if (savedUserString) {
                const savedUser = JSON.parse(savedUserString);
                setUserName(savedUser.name);
            }
        }

        // 로컬 스토리지에서 포럼 게시글 수첩('forum_posts') 꺼내오기!
        const savedForumPosts = localStorage.getItem('forum_posts');
        if (savedForumPosts) {
            setBoardList(JSON.parse(savedForumPosts));
        }

        // 🔥 2. 로컬 스토리지에서 포럼 댓글 수첩('forum_comments') 꺼내오기!
        const savedCommentsString = localStorage.getItem('forum_comments');
        if (savedCommentsString) {
            setAllComments(JSON.parse(savedCommentsString));
        }
    }, []);

    // 🔥 3. 특정 게시글의 '댓글 + 답글' 총 갯수를 계산하는 함수
    const getCommentCount = (postId: number | string): number => {
        // 이 글(postId)에 달린 메인 댓글만 필터링
        const postComments = allComments.filter(c => c.postId === String(postId));

        let count = postComments.length; // 메인 댓글 갯수

        // 메인 댓글 안에 있는 답글(대댓글) 갯수까지 싹 다 더해주기!
        postComments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
                count += comment.replies.length;
            }
        });

        return count;
    };

    // 브랜드 목록 배열
    const brands: string[] = [
        'Canon', 'Sony', 'Nikon', 'Leica', 'Film',
        'Fujifilm', 'Hasselblad', 'Olympus', 'Panasonic', '기타(etc)'
    ];

    // 현재 선택된 브랜드(activeBrand)와 일치하는 글만 골라내기!
    const filteredList = boardList.filter(board => board.brand === activeBrand);

    return (
        <div className="community-container">
            {/* 2. 메인 포럼 영역 (좌/우 분할) */}
            <div className="comm-content">

                {/* 왼쪽: 게시판 메인 영역 */}
                <main className="comm-main">

                    {/* 카메라 브랜드 그리드 버튼 */}
                    <div className="brand-grid-wrapper">
                        <div className="brand-grid">
                            {brands.map((brand) => (
                                <button
                                    key={brand}
                                    className={`brand-btn ${activeBrand === brand ? 'active' : ''}`}
                                    onClick={() => setActiveBrand(brand)}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 게시판 상단 헤더 (현재 브랜드 이름 & 검색) */}
                    <div className="forum-table-header">
                        <div className="current-brand-title">
                            📷 {activeBrand}
                        </div>

                        <div className="comm-sub-filter" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                            <select className="filter-select">
                                <option>제목</option>
                            </select>
                            <input type="text" className="filter-input" placeholder="검색어를 입력해주세요" />
                        </div>
                    </div>

                    {/* 게시글 테이블 */}
                    <table className="comm-table forum-table">
                        <thead>
                        <tr>
                            {/* 🔥 width 속성을 style 속성으로 변경했습니다! */}
                            <th style={{ width: '10%' }}>번호</th>
                            <th style={{ width: '50%' }}>제목</th>
                            <th style={{ width: '15%' }}>작성자</th>
                            <th style={{ width: '15%' }}>작성일</th>
                            <th style={{ width: '10%' }}>조회수</th>
                        </tr>
                        </thead>
                        <tbody>
                        {/* 필터링된 게시글이 없을 때 */}
                        {filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '60px 0', color: '#999', textAlign: 'center' }}>
                                    아직 작성된 게시글이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            // 필터링된 게시글이 있을 때
                            filteredList.map((row, index) => {
                                // 🔥 현재 그리는 게시글의 댓글 수 계산!
                                const commentCount = getCommentCount(row.id);

                                return (
                                    // 🔥 클릭 이벤트와 포인터 추가!
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/forum/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* 최신 글부터 번호 매기기 */}
                                        <td>{filteredList.length - index}</td>
                                        <td className="title-cell">
                                            {/* 게시판 종류(Q&A, 정보공유)를 말머리처럼 달아줍니다! */}
                                            <span style={{ color: '#00bfa5', fontWeight: 'bold', marginRight: '8px' }}>
                                                [{row.boardType}]
                                            </span>
                                            {row.title}
                                            {/* 🔥 댓글이 1개 이상일 때만 빨간색 숫자를 제목 옆에 표시! */}
                                            {commentCount > 0 && (
                                                <span style={{ color: '#ff5252', fontWeight: 'bold', marginLeft: '8px', fontSize: '13px' }}>
                                                    [{commentCount}]
                                                </span>
                                            )}
                                        </td>
                                        <td>{row.author}</td>
                                        <td>{row.date}</td>
                                        <td>{row.views}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </main>

                {/* 오른쪽: 사이드바 영역 */}
                <aside className="comm-sidebar">
                    <div className="sidebar-box profile-box">
                        <div className="profile-info">
                            {/* 로그인 여부에 따라 프로필 사진 변경 */}
                            {isLoggedIn ? (
                                <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=100&auto=format&fit=crop"
                                        alt="프로필"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            ) : (
                                <div className="profile-avatar">👤</div>
                            )}

                            {/* 로그인 여부에 따라 이름 변경 */}
                            <div className="profile-name">
                                {isLoggedIn ? `${userName} 님` : '로그인 해주세요'}
                            </div>
                        </div>

                        {/* 로그인 여부에 따라 버튼 기능과 텍스트 변경 */}
                        {isLoggedIn ? (
                            <button className="write-btn" onClick={() => navigate('/forum/write')}>
                                ✍️ 글쓰기
                            </button>
                        ) : (
                            <Link to="/login" style={{textDecoration: 'none'}}>
                                <button className="write-btn">로그인 하러 가기</button>
                            </Link>
                        )}
                    </div>

                    <div className="sidebar-box popular-box">
                        <h4>실시간 인기 포럼</h4>
                        <hr className="dashed-line" />
                        <div className="popular-content">
                        </div>
                    </div>

                    <div className="sidebar-tag-search">
                        <span className="search-icon">🔍 태그 검색</span>
                        <span className="view-all">전체보기 ≡</span>
                    </div>
                </aside>

            </div>
        </div>
    );
}