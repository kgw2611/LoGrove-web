import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../home/Home.css'
import './Community.css'
import Pagination from '../../shared/ui/Pagination'

type Comment = {
    postId: string
    replies?: Comment[]
}

type Board = {
    id: number
    tag?: string
    title: string
    author: string
    date: string
    views: number
}

const tagNameToCategory: Record<string, string> = {
    'DAILY': '일상',
    'TRADE': '거래',
    'INFO': '정보',
    'QUESTION': '질문',
    'PHOTO': '사진',
    'LOCATION': '출사지',
    'EVENT': '이벤트',
    'REVIEW': '리뷰',
};

export default function Community() {
    const navigate = useNavigate()
    const [activeTag, setActiveTag] = useState<string>('인기순위')

    // 🔥 1. useState 안에서 시작할 때 바로 로컬 스토리지를 뒤져서 초기값을 세팅합니다! (ESLint 에러 해결)
    const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('access_token'))
    const [userName] = useState<string>(() => {
        const savedUserString = localStorage.getItem('user_db')
        if (savedUserString) {
            const savedUser = JSON.parse(savedUserString)
            return savedUser.nickname || savedUser.name || ''
        }
        return ''
    })

    const [boardList, setBoardList] = useState<Board[]>([])
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [allComments] = useState<Comment[]>(() => {
        try {
            const savedCommentsString = localStorage.getItem('community_comments')
            return savedCommentsString ? JSON.parse(savedCommentsString) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        // 🔥 2. 로그인 세팅 로직은 위로 올라갔으므로 여기서는 백엔드 통신만 집중합니다!

        // 가짜 저장소(localStorage)가 아닌 백엔드(DB)에서 진짜 글 목록 불러오기!
        const fetchPosts = async () => {
            try {
                const response = await axios.get(`/api/posts?board=COMMUNITY&page=${currentPage}&size=15`);
                const pageData = response.data.data;
                const postsData = pageData?.content || [];

                // 프론트엔드 형식(Board)에 맞게 데이터 이름표 싹 바꿔주기
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedPosts: Board[] = postsData.map((post: any) => ({
                    id: post.id || post.postId,
                    tag: tagNameToCategory[post.tagNames?.[0]] ?? '',
                    title: post.title,
                    author: post.authorName || post.author || post.nickname || '익명', // 작성자 필드명
                    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
                    views: post.viewCount || post.views || 0
                }));

                setBoardList(formattedPosts);
                setTotalPages(pageData?.totalPages ?? 0);
            } catch (error) {
                console.error('게시글 목록 불러오기 실패:', error);
            }
        };

        fetchPosts();
    }, [currentPage])

    const getCommentCount = (postId: number) => {
        const postComments = allComments.filter(
            (c) => c.postId === String(postId)
        )

        let count = postComments.length
        postComments.forEach((comment) => {
            if (comment.replies && comment.replies.length > 0) {
                count += comment.replies.length
            }
        })
        return count
    }

    const filteredList = (
        activeTag === '인기순위'
            ? boardList
            : boardList.filter((board) => board.tag === activeTag)
    ).slice().sort((a, b) => b.id - a.id)

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
                    <div className="comm-top-search">
                        <span className="search-icon">🔍 태그 검색</span>
                        <span
                            className="view-all"
                            onClick={() => setActiveTag('인기순위')}
                            style={{ cursor: 'pointer' }}
                        >
                            전체보기 ≡
                        </span>
                    </div>

                    <div className="comm-categories">
                        {categoryList.map((tag) => (
                            <button
                                key={tag}
                                className={`cat-btn ${activeTag === tag ? 'active' : ''}`}
                                onClick={() => setActiveTag(tag)}
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
                                const commentCount = getCommentCount(row.id)

                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/community/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{row.id}</td>
                                        <td>
                                            {row.tag && (
                                                <span className={`table-tag ${getTagClass(row.tag)}`}>
                                                        {row.tag}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="title-cell">
                                            {row.title}
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
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
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
                            {/* 나중에 인기글 리스트가 들어갈 자리 */}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}