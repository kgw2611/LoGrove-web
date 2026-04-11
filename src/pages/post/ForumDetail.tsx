import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../home/Home.css';
import './Community.css';
import './ForumDetail.css';

// 타입 정의
interface ReplyType {
    id: number;
    author: string;
    text: string;
    date: string;
}

interface CommentType {
    id: number;
    postId: string | undefined;
    author: string;
    text: string;
    date: string;
    likes: number;
    replies: ReplyType[];
}

interface ForumPostType {
    id: number | string;
    brand: string;
    boardType: string;
    title: string;
    content: string;
    author: string;
    date: string;
    views: number;
}

export default function ForumDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<ForumPostType | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('');

    // 🔥 게시글 본문 수정 모드 상태
    const [isEditingPost, setIsEditingPost] = useState<boolean>(false);
    const [editPostTitle, setEditPostTitle] = useState<string>('');
    const [editPostContent, setEditPostContent] = useState<string>('');

    const [postLike, setPostLike] = useState<{ count: number; isLiked: boolean }>({ count: 0, isLiked: false });
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState<string>('');

    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState<string>('');

    // 🔥 답글(대댓글) 수정 상태 추가
    const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
    const [editReplyText, setEditReplyText] = useState<string>('');

    useEffect(() => {
        const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedInStatus);

        if (loggedInStatus) {
            const savedUserString = localStorage.getItem('user_db');
            // 🔥 이름 대신 닉네임 우선 적용
            if (savedUserString) {
                const parsedUser = JSON.parse(savedUserString);
                setUserName(parsedUser.nickname || parsedUser.name);
            }
        }

        const savedPostsString = localStorage.getItem('forum_posts');
        if (savedPostsString) {
            const savedPosts: ForumPostType[] = JSON.parse(savedPostsString);
            const foundPost = savedPosts.find(p => p.id.toString() === id);

            if (foundPost) {
                setPost(foundPost);
                setPostLike({ count: foundPost.views || 0, isLiked: false });

                // 글 불러올 때 수정용 State에도 값 미리 담아두기
                setEditPostTitle(foundPost.title);
                setEditPostContent(foundPost.content);
            }
        }

        const allComments: CommentType[] = JSON.parse(localStorage.getItem('forum_comments') || '[]');
        const postComments = allComments.filter(c => c.postId === id);
        setComments(postComments);
    }, [id]);

    // 🔥 1️⃣ 게시글 삭제
    const handleDeletePost = () => {
        if (window.confirm('정말 이 포럼 게시글을 삭제하시겠습니까? (댓글도 함께 사라집니다)')) {
            const savedPosts: ForumPostType[] = JSON.parse(localStorage.getItem('forum_posts') || '[]');
            const updatedPosts = savedPosts.filter(p => p.id.toString() !== id);
            localStorage.setItem('forum_posts', JSON.stringify(updatedPosts));

            alert('게시글이 삭제되었습니다.');
            navigate('/forum');
        }
    };

    // 🔥 2️⃣ 게시글 수정 저장
    const handleSavePost = () => {
        if (!editPostTitle.trim() || !editPostContent.trim()) {
            return alert('제목과 내용을 모두 입력해주세요.');
        }

        const savedPosts: ForumPostType[] = JSON.parse(localStorage.getItem('forum_posts') || '[]');
        const updatedPosts = savedPosts.map(p => {
            if (p.id.toString() === id) {
                return { ...p, title: editPostTitle, content: editPostContent };
            }
            return p;
        });

        localStorage.setItem('forum_posts', JSON.stringify(updatedPosts));
        if (post) {
            setPost({ ...post, title: editPostTitle, content: editPostContent });
        }
        setIsEditingPost(false);
        alert('게시글이 성공적으로 수정되었습니다.');
    };

    const updateCommentsInStorage = (updatedComments: CommentType[]) => {
        setComments(updatedComments);
        const allComments: CommentType[] = JSON.parse(localStorage.getItem('forum_comments') || '[]');
        const otherComments = allComments.filter(c => c.postId !== id);
        localStorage.setItem('forum_comments', JSON.stringify([...otherComments, ...updatedComments]));
    };

    const handleCommentSubmit = () => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!newComment.trim()) return alert('댓글 내용을 입력해주세요.');

        const newCommentObj: CommentType = {
            id: Date.now(),
            postId: id,
            author: userName,
            text: newComment,
            date: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            likes: 0,
            replies: []
        };
        updateCommentsInStorage([...comments, newCommentObj]);
        setNewComment('');
    };

    const handleDeleteComment = (commentId: number) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            updateCommentsInStorage(comments.filter(c => c.id !== commentId));
        }
    };

    const startEditing = (comment: CommentType) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.text);
    };

    const handleEditSave = (commentId: number) => {
        if (!editCommentText.trim()) return alert('내용을 입력해주세요.');
        updateCommentsInStorage(comments.map(c => c.id === commentId ? { ...c, text: editCommentText } : c));
        setEditingCommentId(null);
    };

    const handleReplySubmit = (parentId: number) => {
        if (!replyText.trim()) return alert('답글 내용을 입력해주세요.');
        const replyObj: ReplyType = {
            id: Date.now(),
            author: userName,
            text: replyText,
            date: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        };
        updateCommentsInStorage(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), replyObj] } : c));
        setReplyingCommentId(null);
        setReplyText('');
    };

    // 🔥 답글 수정 시작/저장
    const startEditingReply = (reply: ReplyType) => {
        setEditingReplyId(reply.id);
        setEditReplyText(reply.text);
    };

    const handleEditReplySave = (commentId: number, replyId: number) => {
        if (!editReplyText.trim()) return alert('내용을 입력해주세요.');
        updateCommentsInStorage(comments.map(c => {
            if (c.id === commentId) return { ...c, replies: c.replies.map(r => r.id === replyId ? { ...r, text: editReplyText } : r) };
            return c;
        }));
        setEditingReplyId(null);
    };

    // 🔥 답글 삭제
    const handleDeleteReply = (commentId: number, replyId: number) => {
        if (window.confirm('정말 이 답글을 삭제하시겠습니까?')) {
            updateCommentsInStorage(comments.map(c => {
                if (c.id === commentId) return { ...c, replies: c.replies.filter(r => r.id !== replyId) };
                return c;
            }));
        }
    };

    const handleCommentLike = (commentId: number) => {
        updateCommentsInStorage(comments.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
    };

    if (!post) return <div style={{textAlign: 'center', padding: '100px'}}>포럼 게시글을 찾을 수 없습니다.</div>;
    const profileImgSrc = "https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=100&auto=format&fit=crop";

    return (
        <div className="community-container">
            <div className="comm-content">
                <main className="comm-main">
                    <div className="comm-top-search" style={{marginBottom: '20px'}}>
                        <span className="search-icon">🔍 태그 검색</span>
                        <span className="view-all">전체보기 ≡</span>
                    </div>

                    <div className="post-nav-buttons">
                        <button className="nav-btn">∧ 이전글</button>
                        <button className="nav-btn">∨ 다음글</button>
                        <button className="nav-btn list-btn" onClick={() => navigate('/forum')}>목록</button>
                    </div>

                    <div className="post-detail-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <div className="post-category">📷 {post.brand} &gt; {post.boardType}</div>

                            {/* 🔥 내가 쓴 글일 때만 보이는 포럼 본문 수정/삭제 버튼 */}
                            {isLoggedIn && post.author === userName && !isEditingPost && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="action-btn" onClick={() => setIsEditingPost(true)}>수정</button>
                                    <button className="action-btn delete" onClick={handleDeletePost}>삭제</button>
                                </div>
                            )}
                        </div>

                        {/* 🔥 포럼 수정 모드 분기 */}
                        {isEditingPost ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                                <input
                                    type="text"
                                    value={editPostTitle}
                                    onChange={(e) => setEditPostTitle(e.target.value)}
                                    style={{ fontSize: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                                <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    style={{ minHeight: '200px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', resize: 'none', fontFamily: 'inherit' }}
                                />
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={handleSavePost} style={{ padding: '8px 16px', background: '#111', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>저장</button>
                                    <button onClick={() => setIsEditingPost(false)} style={{ padding: '8px 16px', background: '#eee', color: '#333', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>취소</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="post-title">
                                    <span style={{fontWeight: 'bold', marginRight: '8px', color: '#00bfa5'}}>[{post.boardType}]</span>
                                    {post.title}
                                </h1>

                                <div className="post-author-info">
                                    <div className="author-avatar" style={{ overflow: 'hidden' }}>
                                        <img src={profileImgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div className="author-details">
                                        <div className="author-name-row">
                                            <span className="author-name">{post.author}</span>
                                            <button className="subscribe-btn">+ 구독</button>
                                            <button className="chat-btn">1:1 채팅</button>
                                        </div>
                                        <div className="author-meta">
                                            <span>{post.date}</span>
                                            <span>조회수 : {post.views}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="post-divider" />
                                <div className="post-body">{post.content}</div>
                            </>
                        )}

                        <div className="post-footer-actions">
                            <div className="more-posts-link"><span className="author-name-bold">{post.author}</span> 님의 게시글 더보기 &gt;</div>
                            <div className="like-comment-count">
                                <span className={`post-like-btn ${postLike.isLiked ? 'liked' : ''}`} onClick={() => setPostLike({ count: postLike.isLiked ? postLike.count - 1 : postLike.count + 1, isLiked: !postLike.isLiked })}>
                                    {postLike.isLiked ? '❤️' : '🤍'} 좋아요 {postLike.count}
                                </span>
                                <span>💬 댓글 {comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0)}</span>
                            </div>
                        </div>

                        {/* 댓글 렌더링 영역 */}
                        <div className="comments-section">
                            {comments.map(comment => (
                                <div key={comment.id}>
                                    <div className="comment-item">
                                        <div className="comment-avatar" style={{ overflow: 'hidden' }}><img src={profileImgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                                        <div className="comment-content">
                                            <div className="comment-author">{comment.author}</div>
                                            {editingCommentId === comment.id ? (
                                                <div className="edit-input-box">
                                                    <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} />
                                                    <button className="edit-btn" onClick={() => handleEditSave(comment.id)}>저장</button>
                                                    <button className="cancel-btn" onClick={() => setEditingCommentId(null)}>취소</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="comment-text">{comment.text}</div>
                                                    <div className="comment-date">{comment.date}</div>
                                                    <div className="comment-actions">
                                                        <button className="action-btn" onClick={() => handleCommentLike(comment.id)}>🤍 {comment.likes || 0}</button>
                                                        <button className="action-btn" onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}>답글쓰기</button>
                                                        {isLoggedIn && comment.author === userName && (
                                                            <>
                                                                <button className="action-btn" onClick={() => startEditing(comment)}>수정</button>
                                                                <button className="action-btn delete" onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* 대댓글 렌더링 */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="replies-container">
                                            {comment.replies.map(reply => (
                                                <div className="reply-item" key={reply.id}>
                                                    <div className="reply-avatar" style={{ overflow: 'hidden' }}><img src={profileImgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                                                    <div className="comment-content">
                                                        <div className="comment-author">{reply.author}</div>
                                                        {/* 🔥 답글 수정 모드 분기 */}
                                                        {editingReplyId === reply.id ? (
                                                            <div className="edit-input-box">
                                                                <input value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} />
                                                                <button className="edit-btn" onClick={() => handleEditReplySave(comment.id, reply.id)}>저장</button>
                                                                <button className="cancel-btn" onClick={() => setEditingReplyId(null)}>취소</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="comment-text">{reply.text}</div>
                                                                <div className="comment-date">{reply.date}</div>
                                                                {/* 🔥 내 답글일 때만 수정/삭제 보이기 */}
                                                                {isLoggedIn && reply.author === userName && (
                                                                    <div className="comment-actions">
                                                                        <button className="action-btn" onClick={() => startEditingReply(reply)}>수정</button>
                                                                        <button className="action-btn delete" onClick={() => handleDeleteReply(comment.id, reply.id)}>삭제</button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* 답글 입력창 */}
                                    {replyingCommentId === comment.id && (
                                        <div className="replies-container" style={{ border: 'none' }}>
                                            <div className="edit-input-box">
                                                <input placeholder={`${comment.author}님에게 답글 남기기...`} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                                                <button className="edit-btn" onClick={() => handleReplySubmit(comment.id)}>등록</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 메인 댓글 창 */}
                        <div className="comment-input-box">
                            <div className="comment-input-author">{isLoggedIn ? userName : '로그인 해주세요'}</div>
                            <textarea placeholder={isLoggedIn ? "댓글을 남겨보세요" : "로그인 후 댓글을 작성할 수 있습니다."} value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={!isLoggedIn}></textarea>
                            <div className="comment-input-bottom">
                                <div className="comment-icons">📷 😊</div>
                                <button className="submit-comment-btn" onClick={handleCommentSubmit}>등록</button>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className="comm-sidebar">
                    <div className="sidebar-box profile-box">
                        <div className="profile-info">
                            {isLoggedIn ? (
                                <div className="profile-avatar" style={{ overflow: 'hidden' }}><img src={profileImgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                            ) : (<div className="profile-avatar">👤</div>)}
                            <div className="profile-name">{isLoggedIn ? `${userName} 님` : '로그인 해주세요'}</div>
                        </div>
                        {isLoggedIn ? (
                            <button className="write-btn" onClick={() => navigate('/forum/write')}>✍️ 글쓰기</button>
                        ) : (
                            <Link to="/login" style={{textDecoration: 'none'}}><button className="write-btn">로그인 하러 가기</button></Link>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}