import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

    const [boardList, setBoardList] = useState<Board[]>([])
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [userName, setUserName] = useState<string>('')

    // 🔥 1. 전체 댓글 목록을 담을 상태 추가!
    const [allComments, setAllComments] = useState<Comment[]>([])

    useEffect(() => {
        // 로그인 상태 확인
        const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true'
        setIsLoggedIn(loggedInStatus)

        if (loggedInStatus) {
            const savedUserString = localStorage.getItem('user_db')
            if (savedUserString) {
                const savedUser: { name: string } = JSON.parse(savedUserString)
                setUserName(savedUser.name)
            }
        }

        // 게시글 목록 꺼내오기
        const savedPostsString = localStorage.getItem('community_posts')
        if (savedPostsString) {
            const savedPosts: Board[] = JSON.parse(savedPostsString)
            setBoardList(savedPosts)
        }

        // 🔥 2. 댓글 목록 꺼내오기
        const savedCommentsString = localStorage.getItem('community_comments')
        if (savedCommentsString) {
            setAllComments(JSON.parse(savedCommentsString))
        }
    }, [])

    // 🔥 3. 특정 게시글의 '댓글 + 답글' 총 갯수를 계산하는 함수
    const getCommentCount = (postId: number) => {
        // 이 글(postId)에 달린 메인 댓글만 필터링
        const postComments = allComments.filter(
            (c) => c.postId === String(postId)
        )

        let count = postComments.length // 메인 댓글 갯수

        // 메인 댓글 안에 있는 답글(대댓글) 갯수까지 싹 다 더해주기!
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
            case '일상':
                return 'tag-green'
            case '출사':
                return 'tag-blue'
            case '자유':
                return 'tag-orange'
            case '사진':
                return 'tag-pink'
            default:
                return 'tag-default'
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
                            {/* 🔥 width 속성을 style 속성으로 변경했습니다! */}
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
                                // 🔥 현재 그리는 게시글의 댓글 수 계산!
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
                                                <span
                                                    className={`table-tag ${getTagClass(row.tag)}`}
                                                >
                            {row.tag}
                          </span>
                                            )}
                                        </td>
                                        <td className="title-cell">
                                            {row.title}
                                            {/* 🔥 댓글이 1개 이상일 때만 빨간색 숫자를 제목 옆에 표시! */}
                                            {commentCount > 0 && (
                                                <span
                                                    style={{
                                                        color: '#ff5252',
                                                        fontWeight: 'bold',
                                                        marginLeft: '8px',
                                                        fontSize: '13px',
                                                    }}
                                                >
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
                                    style={{
                                        padding: '60px 0',
                                        color: '#999',
                                        textAlign: 'center',
                                    }}
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
                                <div
                                    className="profile-avatar"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <img
                                        src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=100&auto=format&fit=crop"
                                        alt="프로필"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
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
                            <button
                                className="write-btn"
                                onClick={() => navigate('/community/write')}
                            >
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