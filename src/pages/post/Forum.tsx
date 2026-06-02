import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './Forum.css';
import Pagination from '../../shared/ui/Pagination';
import { getValidToken } from '../../shared/utils/auth';
import { truncateWithPeriods } from '../../shared/utils/text';

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

type SearchType = 'title_content' | 'author';

const tagNameToBrand: Record<string, string> = {
    '캐논': 'Canon',
    '소니': 'Sony',
    '니콘': 'Nikon',
    '후지필름': 'Fujifilm',
    '라이카': 'Leica',
    '핫셀블라드': 'Hasselblad',
    '파나소닉': 'Panasonic',
    '올림푸스': 'Olympus',
    '기타': '전체',
    '전체': '전체',
    '필름': 'Film',
};

const brandTagIdMap: Record<string, number> = {
    Canon: 9,
    Sony: 10,
    Nikon: 11,
    Fujifilm: 12,
    Leica: 13,
    Hasselblad: 14,
    Panasonic: 15,
    Olympus: 16,
    Film: 76,
};

export default function Forum() {
    const navigate = useNavigate();

    const [activeBrand, setActiveBrand] = useState<string>('전체');
    const [isLoggedIn] = useState<boolean>(() => !!getValidToken());
    const [userName, setUserName] = useState<string>('');

    const [boardList, setBoardList] = useState<ForumPostType[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [popularSidebar, setPopularSidebar] = useState<ForumPostType[]>([]);
    const [myProfileUrl, setMyProfileUrl] = useState<string | null>(null);

    const [inputTerm, setInputTerm] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchType, setSearchType] = useState<SearchType>('title_content');

    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = getValidToken();
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
    const brandTagNames = Object.keys(tagNameToBrand);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatPost = (post: any, index?: number): ForumPostType => ({
        id: post.id || post.postId,
        rowNumber: index !== undefined ? index + 1 : post.rowNumber,
        brand: tagNameToBrand[post.tagNames?.[0]] ?? '',
        boardType: post.tagNames?.find((tag: string) => !brandTagNames.includes(tag)) ?? 'Q&A',
        title: post.title,
        author: post.authorName || post.author || post.nickname || '익명',
        date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
        views: post.view || 0,
        commentCount: post.commentCount || post.commentsCount || 0
    });

    useEffect(() => {
        const fetchPopularSidebar = async () => {
            try {
                const response = await axios.get('/api/posts/popular?board=FORUM&days=7');
                const postsData: ForumPostType[] = (response.data.data || []).slice(0, 5).map(formatPost);
                setPopularSidebar(postsData);
            } catch (error) {
                console.error('포럼 인기 게시글 사이드바 불러오기 실패:', error);
            }
        };
        fetchPopularSidebar();
    }, []);

    useEffect(() => {
        const fetchForumPosts = async () => {
            try {
                const params = new URLSearchParams({
                    board: 'FORUM',
                    page: String(currentPage),
                    size: '15',
                });
                const brandTagId = brandTagIdMap[activeBrand];

                if (activeBrand !== '전체' && brandTagId) {
                    params.set('tagIds', String(brandTagId));
                }

                if (searchTerm.trim()) {
                    params.set('searchType', searchType);
                    params.set('keyword', searchTerm.trim());
                }

                const response = await axios.get(`/api/posts?${params.toString()}`);

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
    }, [currentPage, activeBrand, searchTerm, searchType]);

    const handleBrandChange = (brand: string) => {
        setActiveBrand(brand);
        setCurrentPage(0);
        setInputTerm('');
        setSearchTerm('');
    };

    const applySearch = () => {
        setSearchTerm(inputTerm.trim());
        setCurrentPage(0);
    };

    const brands: string[] = [
        '전체', 'Canon', 'Sony', 'Nikon', 'Leica', 'Film',
        'Fujifilm', 'Hasselblad', 'Olympus', 'Panasonic'
    ];

    const filteredList = useMemo(() => {
        return boardList.slice().sort((a, b) => Number(b.id) - Number(a.id));
    }, [boardList]);

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

                    <div className="comm-search-bar">
                        <select
                            className="comm-search-select"
                            value={searchType}
                            onChange={(e) => {
                                setSearchType(e.target.value as SearchType);
                                setCurrentPage(0);
                            }}
                        >
                            <option value="title_content">제목+본문</option>
                            <option value="author">작성자</option>
                        </select>
                        <input
                            type="text"
                            className="comm-search-input"
                            placeholder="검색어를 입력해주세요"
                            value={inputTerm}
                            onChange={(e) => setInputTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applySearch();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="comm-search-btn"
                            onClick={applySearch}
                        >
                            검색
                        </button>
                    </div>
                    <div className="forum-table-header">
                        <div className="current-brand-title">
                            📷 {activeBrand}
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
                            filteredList.map((row, index) => {
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/forum/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{filteredList.length - index}</td>
                                        <td className="title-cell">
                                            {row.brand && (
                                                <span style={{ color: '#00bfa5', fontWeight: 'bold', marginRight: '6px' }}>
                                                    [{row.brand}]
                                                </span>
                                            )}
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
                                        <img
                                            src={myProfileUrl}
                                            alt=""
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
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
                                    <span className="popular-title" title={post.title}>
                                        {truncateWithPeriods(post.title, 17)}
                                    </span>
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
