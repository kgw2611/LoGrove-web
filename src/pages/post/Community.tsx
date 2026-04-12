import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios' // 🔥 백엔드 통신을 위한 axios 추가!
import '../home/Home.css'
import './Community.css'

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
    const [allComments, setAllComments] = useState<Comment[]>([])

    useEffect(() => {
        // 🔥 2. 로그인 세팅 로직은 위로 올라갔으므로 여기서는 백엔드 통신만 집중합니다!

        // 가짜 저장소(localStorage)가 아닌 백엔드(DB)에서 진짜 글 목록 불러오기!
        const fetchPosts = async () => {
            try {
                // 건우님 컨트롤러에 맞춰서 board 파라미터를 'COMMUNITY'로 보냅니다.
                const response = await axios.get('/api/posts?board=COMMUNITY');

                // 🚨 주의: 백엔드 응답 구조(Page 객체 등)에 따라 데이터 위치가 다를 수 있습니다.
                // 보통 Spring Boot의 Page 객체는 response.data.data.content 안에 배열이 들어있습니다.
                const postsData = response.data.data?.content || response.data.content || response.data.data || [];

                // 프론트엔드 형식(Board)에 맞게 데이터 이름표 싹 바꿔주기
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedPosts: Board[] = postsData.map((post: any) => ({
                    id: post.id || post.postId,
                    tag: post.tagName || post.tag || 'COMMUNITY', // 백엔드 태그 필드명에 맞추세요
                    title: post.title,
                    author: post.authorName || post.author || post.nickname || '익명', // 작성자 필드명
                    date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '방금 전',
                    views: post.viewCount || post.views || 0
                }));

                setBoardList(formattedPosts);
            } catch (error) {
                console.error('게시글 목록 불러오기 실패:', error);
            }
        };

        fetchPosts(); // 함수 실행!

        // 댓글 목록 꺼내오기 (이 부분도 나중에 백엔드 API로 교체해야 합니다!)
        const savedCommentsString = localStorage.getItem('community_comments')
        if (savedCommentsString) {
            setAllComments(JSON.parse(savedCommentsString))
        }
    }, [])

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

    const filteredList =
        activeTag === '인기순위'
            ? boardList
            : boardList.filter((board) => board.tag === activeTag)

    const categoryList = ['인기순위', '일상', '자유', '사진', '거래', '유머', '출사']

    const getTagClass = (tag?: string) => {
        switch (tag) {
            case '일상': return 'tag-green'
            case '출사': return 'tag-blue'
            case '자유': return 'tag-orange'
            case '사진': return 'tag-pink'
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
                            filteredList.map((row, index) => {
                                const commentCount = getCommentCount(row.id)

                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => navigate(`/community/${row.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{filteredList.length - index}</td>
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