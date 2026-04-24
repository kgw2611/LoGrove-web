import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './Forum.css';
import Pagination from '../../shared/ui/Pagination';

// 🔥 필요 없어진 로컬 스토리지용 CommentType, ReplyType 삭제!

interface ForumPostType {
    id: number | string;
    rowNumber?: number; // 서버에서 주는 글 번호용
    brand: string;
    boardType: string;
    title: string;
    author: string;
    date: string;
    views: number;
    commentCount: number; // 🔥 백엔드에서 주는 댓글 개수를 담을 공간 추가!
}

const tagNameToBrand: Record<string, string> = {
    '캐논': 'Canon',
    '소니': 'Sony',
    '니콘': 'Nikon',
    '후지필름': 'Fujifilm',
    '라이카': 'Leica',
    '핫셀블라드': 'Hasselblad',
    '파나소닉': 'Panasonic',
    '올림푸스': 'Olympus',
    '기타': '기타(etc)',
    '필름': 'Film',
};

export default function Forum() {
    const navigate = useNavigate();

    const [activeBrand, setActiveBrand] = useState<string>('Canon');

    const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('access_token'));

    // 🔥 수정 1: 사이드바 닉네임을 서버에서 받아오기 위해 빈 문자열로 세팅
    const [userName, setUserName] = useState<string>('');

    const [boardList, setBoardList] = useState<ForumPostType[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // 🔥 로컬 스토리지에서 댓글 뒤지던 allComments 상태는 완전히 삭제했습니다!

    // 🔥 수정 2: 시작할 때 백엔드에서 내 진짜 정보(닉네임)를 가져옵니다!
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await axios.get('/api/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = response.data.data || response.data;
                    setUserName(data.nickname || data.name || '익명');
                } catch (error) {
                    console.error("내 정보 불러오기 실패", error);
                    const savedUserString = localStorage.getItem('user_db');
                    if (savedUserString) {
                        const savedUser = JSON.parse(savedUserString);
                        setUserName(savedUser.nickname || savedUser.name || '');
                    }
                }
            }
        };
        fetchMyInfo();
    }, []);

    useEffect(() => {
        const fetchForumPosts = async () => {
            try {
                const response = await axios.get(`/api/posts?board=FORUM&page=${currentPage}&size=15`);

                const pageData = response.data.data;
                const postsData = pageData?.content || response.data.content || response.data.data || [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedPosts: ForumPostType[] = postsData.map((post: any) => ({
                    id: post.id || post.postId,
                    rowNumber: post.rowNumber,
                    brand: tagNameToBrand[post.tagNames?.[0]] ?? '',
                    boardType: 'Q&A',
                    title: post.title,
                    author: post.authorName || post.author || post.nickname || '익명',
                    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
                    // 🔥 백엔드 변수명 `view`로 완벽 매칭!
                    views: post.view || 0,
                    // 🔥 백엔드에서 아직 안 보내주지만 미리 세팅해 둡니다! (댓글 개수)
                    commentCount: post.commentCount || post.commentsCount || 0
                }));

                setBoardList(formattedPosts);
                setTotalPages(pageData?.totalPages ?? 0);
            } catch (error) {
                console.error('포럼 게시글 목록 불러오기 실패:', error);
            }
        };

        fetchForumPosts();
    }, [currentPage]);

    const brands: string[] = [
        'Canon', 'Sony', 'Nikon', 'Leica', 'Film',
        'Fujifilm', 'Hasselblad', 'Olympus', 'Panasonic', '기타(etc)'
    ];

    const filteredList = boardList
        .filter((board) => board.brand === activeBrand)
        .slice()
        .sort((a, b) => Number(b.id) - Number(a.id));

    return (
        <div className="community-container">
            <div className="comm-content">
                <main className="comm-main">
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

                    <table className="comm-table forum-table">
                        <thead>
                        <tr>
                            <th style={{ width: '10%' }}>번호</th>
                            <th style={{ width: '50%' }}>제목</th>
                            <th style={{ width: '15%' }}>작성자</th>
                            <th style={{ width: '15%' }}>작성일</th>
                            <th style={{ width: '10%' }}>조회수</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '60px 0', color: '#999', textAlign: 'center' }}>
                                    아직 {activeBrand} 게시글이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((row) => {
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/forum/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{row.rowNumber || row.id}</td>
                                        <td className="title-cell">
                                            <span style={{ color: '#00bfa5', fontWeight: 'bold', marginRight: '8px' }}>
                                                [{row.boardType}]
                                            </span>
                                            {row.title}
                                            {/* 🔥 백엔드에서 받은 댓글 개수가 0보다 크면 숫자를 띄웁니다! */}
                                            {row.commentCount > 0 && (
                                                <span style={{ color: '#ff5252', fontWeight: 'bold', marginLeft: '8px', fontSize: '13px' }}>
                                                    [{row.commentCount}]
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
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </main>

                <aside className="comm-sidebar">
                    <div className="sidebar-box profile-box">
                        <div className="profile-info">
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

                            <div className="profile-name">
                                {/* 🔥 백엔드에서 갓 받아온 닉네임 연동! */}
                                {isLoggedIn ? `${userName} 님` : '로그인 해주세요'}
                            </div>
                        </div>

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