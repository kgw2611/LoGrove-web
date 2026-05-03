import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './Forum.css';
import Pagination from '../../shared/ui/Pagination';

interface ForumPostType {
    id: number | string;
    rowNumber?: number;
    brand: string;
    boardType: string;
    title: string;
    author: string;
    date: string;
    views: number;
    commentCount: number;
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
    const [userName, setUserName] = useState<string>('');

    const [boardList, setBoardList] = useState<ForumPostType[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [popularSidebar, setPopularSidebar] = useState<ForumPostType[]>([]);
    const [myProfileUrl, setMyProfileUrl] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');

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
                    setMyProfileUrl(data.profileUrl || null);
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

    // 🔥 포스트 데이터 변환 함수 (인기글, 일반글 공통 사용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatPost = (post: any, index?: number): ForumPostType => ({
        id: post.id || post.postId,
        rowNumber: index !== undefined ? index + 1 : post.rowNumber,
        brand: tagNameToBrand[post.tagNames?.[0]] ?? '',
        boardType: post.boardType || 'Q&A', // 백엔드에서 오는 게시판 타입이 있다면 사용, 없으면 기본값
        title: post.title,
        author: post.authorName || post.author || post.nickname || '익명',
        date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
        views: post.view || 0,
        commentCount: post.commentCount || post.commentsCount || 0
    });

    // 🔥 2. 포럼 인기글 데이터를 서버에서 가져오는 useEffect 추가!
    useEffect(() => {
        const fetchPopularSidebar = async () => {
            try {
                // 커뮤니티와 동일하게 인기글 API 호출, 단 board 파라미터를 FORUM으로!
                const response = await axios.get('/api/posts/popular?board=FORUM');
                const postsData: ForumPostType[] = (response.data.data || []).slice(0, 5).map(formatPost);
                setPopularSidebar(postsData);
            } catch (error) {
                console.error('포럼 인기 게시글 사이드바 불러오기 실패:', error);
            }
        };
        fetchPopularSidebar();
    }, []);

    useEffect(() => {
        const fetchPopularSidebar = async () => {
            try {
                const response = await axios.get('/api/posts/popular?board=FORUM&days=7');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const posts: ForumPostType[] = (response.data.data || []).slice(0, 5).map((post: any) => ({
                    id: post.id || post.postId,
                    brand: tagNameToBrand[post.tagNames?.[0]] ?? '',
                    boardType: 'Q&A',
                    title: post.title,
                    author: post.authorName || post.author || '익명',
                    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
                    views: post.view || 0,
                    commentCount: post.commentCount || 0,
                }));
                setPopularSidebar(posts);
            } catch (error) {
                console.error('인기 포럼 불러오기 실패:', error);
            }
        };
        fetchPopularSidebar();
    }, []);

    useEffect(() => {
        const fetchForumPosts = async () => {
            try {
                const response = await axios.get(`/api/posts?board=FORUM&page=${currentPage}&size=15`);

                const pageData = response.data.data;
                const postsData = pageData?.content || response.data.content || response.data.data || [];

                // 공통 포맷 함수 사용
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedPosts: ForumPostType[] = postsData.map((post: any) => formatPost(post));

                setBoardList(formattedPosts);
                setTotalPages(pageData?.totalPages ?? 0);
            } catch (error) {
                console.error('포럼 게시글 목록 불러오기 실패:', error);
            }
        };

        fetchForumPosts();
    }, [currentPage]);

    const handleBrandChange = (brand: string) => {
        setActiveBrand(brand);
        setCurrentPage(0);
        setSearchTerm('');
    };

    const brands: string[] = [
        'Canon', 'Sony', 'Nikon', 'Leica', 'Film',
        'Fujifilm', 'Hasselblad', 'Olympus', 'Panasonic', '기타(etc)'
    ];

    const filteredList = useMemo(() => {
        let baseList = boardList
            .filter((board) => board.brand === activeBrand)
            .slice()
            .sort((a, b) => Number(b.id) - Number(a.id));

        if (searchTerm.trim()) {
            const lowerKeyword = searchTerm.toLowerCase();
            baseList = baseList.filter(post => post.title.toLowerCase().includes(lowerKeyword));
        }

        return baseList;
    }, [boardList, activeBrand, searchTerm]);

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
                                    onClick={() => handleBrandChange(brand)}
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
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="검색어를 입력해주세요"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                                    {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : `아직 ${activeBrand} 게시글이 없습니다.`}
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
                                    {myProfileUrl ? (
                                        <img src={myProfileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '28px', lineHeight: 1 }}>👤</span>
                                    )}
                                </div>
                            ) : (
                                <div className="profile-avatar">👤</div>
                            )}

                            <div className="profile-name">
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
                            {popularSidebar.map((post, index) => (
                                <div
                                    key={post.id}
                                    className="popular-item"
                                    onClick={() => navigate(`/forum/${post.id}`)}
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
    );
}