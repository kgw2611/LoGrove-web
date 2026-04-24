import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../home/Home.css'
import './Community.css'
import Pagination from '../../shared/ui/Pagination'

type Board = {
    id: number
    rowNumber: number
    tag?: string
    title: string
    author: string
    date: string
    views: number
    commentCount: number
}

const tagNameToCategory: Record<string, string> = {
    '일상': '일상',
    '거래': '거래',
    '정보': '정보',
    '질문': '질문',
    '사진': '사진',
    '출사지': '출사지',
    '이벤트': '이벤트',
    '리뷰': '리뷰',
};

const categoryToTagId: Record<string, number> = {
    '일상': 1,
    '거래': 2,
    '정보': 3,
    '질문': 4,
    '사진': 5,
    '출사지': 6,
    '이벤트': 7,
    '리뷰': 79,
};

export default function Community() {
    const navigate = useNavigate()
    const [activeTag, setActiveTag] = useState<string>('인기순위')

    const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('access_token'))

    // 사이드바 닉네임을 서버에서 받아오기 위해 빈 문자열로 세팅
    const [userName, setUserName] = useState<string>('')

    const [boardList, setBoardList] = useState<Board[]>([])
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [popularSidebar, setPopularSidebar] = useState<Board[]>([])

    // 시작할 때 백엔드에서 내 진짜 정보(닉네임)를 가져옵니다!
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
                    // 에러 나면 임시로 로컬 데이터 사용
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatPost = (post: any, index?: number): Board => ({
        id: post.id || post.postId,
        rowNumber: index !== undefined ? index + 1 : post.rowNumber,
        tag: tagNameToCategory[post.tagNames?.[0]] ?? '',
        title: post.title,
        author: post.authorName || post.author || post.nickname || '익명',
        date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
        views: post.view || 0,
        commentCount: post.commentCount || post.commentsCount || 0,
    });

    useEffect(() => {
        const fetchPopularSidebar = async () => {
            try {
                const response = await axios.get('/api/posts/popular?board=COMMUNITY');
                const postsData: Board[] = (response.data.data || []).slice(0, 5).map(formatPost);
                setPopularSidebar(postsData);
            } catch (error) {
                console.error('인기 게시글 사이드바 불러오기 실패:', error);
            }
        };
        fetchPopularSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                if (activeTag === '인기순위') {
                    const response = await axios.get('/api/posts/popular?board=COMMUNITY');
                    const postsData: Board[] = (response.data.data || []).map(formatPost);
                    setBoardList(postsData);
                    setTotalPages(0);
                    return;
                }

                const tagId = categoryToTagId[activeTag];
                const url = tagId
                    ? `/api/posts?board=COMMUNITY&tagIds=${tagId}&page=${currentPage}&size=15`
                    : `/api/posts?board=COMMUNITY&page=${currentPage}&size=15`;

                const response = await axios.get(url);
                const pageData = response.data.data;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const postsData: Board[] = (pageData?.content || []).map((post: any) => formatPost(post));

                setBoardList(postsData);
                setTotalPages(pageData?.totalPages ?? 0);
            } catch (error) {
                console.error('게시글 목록 불러오기 실패:', error);
            }
        };

        fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, activeTag])

    const handleTagChange = (tag: string) => {
        setActiveTag(tag)
        setCurrentPage(0)
    }

    const filteredList = activeTag === '인기순위'
        ? boardList
        : boardList.slice().sort((a, b) => b.id - a.id)

    const categoryList = ['인기순위', '일상', '거래', '정보', '질문', '사진', '출사지', '이벤트', '리뷰']

    const getTagClass = (tag?: string) => {
        switch (tag) {
            case '일상': return 'tag-green'
            case '사진': return 'tag-pink'
            case '거래': return 'tag-orange'
            case '정보': return 'tag-blue'
            case '질문': return 'tag-blue'
            default: return 'tag-default'
        }
    }

    return (
        <div className="community-container">
            <div className="comm-content">
                {/* 왼쪽: 게시판 메인 영역 */}
                <main className="comm-main">
                    <div className="comm-categories">
                        {categoryList.map((tag) => (
                            <button
                                key={tag}
                                className={`cat-btn ${activeTag === tag ? 'active' : ''}`}
                                onClick={() => handleTagChange(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="comm-sub-filter">
                        <select className="filter-select">
                            <option>제목</option>
                        </select>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="검색어를 입력해주세요"
                        />
                    </div>

                    <table className="comm-table">
                        <thead>
                        <tr>
                            <th style={{ width: '10%' }}>번호</th>
                            <th style={{ width: '15%' }}>태그</th>
                            <th style={{ width: '40%' }}>제목</th>
                            <th style={{ width: '15%' }}>작성자</th>
                            <th style={{ width: '10%' }}>작성일</th>
                            <th style={{ width: '10%' }}>조회수</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredList.length > 0 ? (
                            filteredList.map((row) => {
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/community/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{row.rowNumber}</td>
                                        <td>
                                            {row.tag && (
                                                <span className={`table-tag ${getTagClass(row.tag)}`}>
                                                        {row.tag}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="title-cell">
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
                                )
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{ padding: '60px 0', color: '#999', textAlign: 'center' }}
                                >
                                    아직 작성된 게시글이 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    {activeTag !== '인기순위' && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    )}
                </main>

                {/* 오른쪽: 사이드바 영역 */}
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
                                {/* 🔥 백엔드 연동 완료! */}
                                {isLoggedIn ? `${userName} 님` : '로그인 해주세요'}
                            </div>
                        </div>

                        {isLoggedIn ? (
                            <button className="write-btn" onClick={() => navigate('/community/write')}>
                                ✍️ 글쓰기
                            </button>
                        ) : (
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <button className="write-btn">로그인 하러 가기</button>
                            </Link>
                        )}
                    </div>

                    <div className="sidebar-box popular-box">
                        <h4>실시간 인기 게시판</h4>
                        <hr className="dashed-line" />
                        <div className="popular-content">
                            {popularSidebar.map((post, index) => (
                                <div
                                    key={post.id}
                                    className="popular-item"
                                    onClick={() => navigate(`/community/${post.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="popular-rank">{index + 1}</span>
                                    <span className="popular-title">{post.title}</span>
                                    <span className="popular-views">{post.views}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}