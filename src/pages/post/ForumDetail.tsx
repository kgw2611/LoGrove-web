import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './ForumDetail.css';

// 🔥 이미지 경로에 새로운 백엔드 주소(3.38.12.226)를 붙여주도록 수정!
const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

interface CommentType {
    id: number;
    postId: string | undefined;
    author: string;
    text: string;
    date: string;
    isEdited: boolean;
    likes: number;
    isLiked: boolean;
    profileUrl?: string;
    replies: CommentType[];
}

interface ForumPostType {
    id: number | string;
    brand: string;
    boardType: string;
    title: string;
    content: string;
    author: string;
    date: string;
    isEdited: boolean;
    views: number;
    images?: string[];
    profileUrl?: string;
}

export default function ForumDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<ForumPostType | null>(null);

    const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('access_token'));

    const [userName, setUserName] = useState<string>('');

    const [isEditingPost, setIsEditingPost] = useState<boolean>(false);
    const [editPostTitle, setEditPostTitle] = useState<string>('');
    const [editPostContent, setEditPostContent] = useState<string>('');

    const [postLike, setPostLike] = useState<{ count: number; isLiked: boolean }>({ count: 0, isLiked: false });

    // 댓글 상태
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState<string>('');
    const [myProfileUrl, setMyProfileUrl] = useState<string | null>(null);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`/api/posts/${id}/comments`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = response.data.data || response.data || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapComment = (c: any): CommentType => {
                const edited = c.updatedAt && c.createdAt && c.updatedAt !== c.createdAt;
                return {
                    id: c.id || c.commentId,
                    postId: id,
                    author: c.authorName || c.nickname || '익명',
                    text: c.content || c.text,
                    date: edited ? new Date(c.updatedAt).toLocaleDateString() : (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '방금 전'),
                    isEdited: !!edited,
                    likes: c.likeCount || c.likes || 0,
                    isLiked: c.isLiked || false,
                    profileUrl: c.profileUrl || undefined,
                    replies: (c.replies || []).map(mapComment),
                };
            };
            setComments(data.map(mapComment));
        } catch (error) {
            console.error("댓글 불러오기 실패:", error);
        }
    };

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get(`/api/posts/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = response.data.data || response.data;

                const postEdited = data.updatedAt && data.createdAt && data.updatedAt !== data.createdAt;
                const formattedPost: ForumPostType = {
                    id: data.id || data.postId,
                    title: data.title,
                    content: data.content,
                    author: data.authorName || data.author || data.nickname || '익명',
                    brand: data.tagName || data.tag || 'Canon',
                    boardType: data.boardType || 'Q&A',
                    date: postEdited ? new Date(data.updatedAt).toLocaleDateString() : (data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '방금 전'),
                    isEdited: !!postEdited,
                    views: data.view ?? data.viewCount ?? data.views ?? 0,
                    images: data.images || data.imageUrls || data.postImages || [],
                    profileUrl: data.profileUrl || undefined,
                };

                setPost(formattedPost);
                setEditPostTitle(formattedPost.title);
                setEditPostContent(formattedPost.content);
                // isLiked가 게시글 상세 응답에 포함되어 별도 /like API 호출 불필요
                setPostLike({ count: data.likeCount || 0, isLiked: data.isLiked || false });
            } catch (error) {
                console.error("포럼 게시글 상세 조회 실패:", error);
                alert("게시글을 불러올 수 없습니다. 삭제되었거나 존재하지 않는 글입니다.");
                navigate('/forum');
            }
        };

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
                    // 실패 시 로컬 스토리지로 폴백
                    const savedUserString = localStorage.getItem('user_db');
                    if (savedUserString) {
                        const parsedUser = JSON.parse(savedUserString);
                        setUserName(parsedUser.nickname || parsedUser.name || '익명');
                    }
                }
            }
        };

        if (id) {
            fetchPostDetail();
            fetchComments();
        }

        fetchMyInfo(); // 내 이름 불러오기 함수 실행!

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    const handleDeletePost = async () => {
        if (window.confirm('정말 이 포럼 게시글을 삭제하시겠습니까? (댓글도 함께 사라집니다)')) {
            try {
                const token = localStorage.getItem('access_token');
                await axios.delete(`/api/posts/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                alert('게시글이 삭제되었습니다.');
                navigate('/forum');
            } catch (error) {
                console.error("게시글 삭제 실패:", error);
                alert("삭제에 실패했습니다. 본인이 작성한 글인지 확인해주세요.");
            }
        }
    };

    const handleSavePost = async () => {
        if (!editPostTitle.trim() || !editPostContent.trim()) {
            return alert('제목과 내용을 모두 입력해주세요.');
        }

        try {
            const token = localStorage.getItem('access_token');
            const requestData = {
                title: editPostTitle,
                content: editPostContent,
                boardType: 'FORUM'
            };

            await axios.put(`/api/posts/${id}`, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (post) {
                setPost({ ...post, title: editPostTitle, content: editPostContent });
            }
            setIsEditingPost(false);
            alert('게시글이 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            alert("수정에 실패했습니다. 본인이 작성한 글인지 확인해주세요.");
        }
    };

    const handleCommentSubmit = async () => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!newComment.trim()) return alert('댓글 내용을 입력해주세요.');

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`/api/posts/${id}/comments`, { content: newComment }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글을 등록하지 못했습니다.");
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                const token = localStorage.getItem('access_token');
                await axios.delete(`/api/posts/${id}/comments/${commentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchComments();
            } catch (error) {
                console.error("댓글 삭제 실패", error);
                alert("삭제 권한이 없습니다.");
            }
        }
    };

    const startEditing = (comment: CommentType) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.text);
    };

    const handleEditSave = async (commentId: number) => {
        if (!editCommentText.trim()) return alert('내용을 입력해주세요.');
        try {
            const token = localStorage.getItem('access_token');
            await axios.put(`/api/posts/${id}/comments/${commentId}`, { content: editCommentText }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setEditingCommentId(null);
            fetchComments();
        } catch (error) {
            console.error("댓글 수정 실패", error);
            alert("수정 권한이 없습니다.");
        }
    };

    const handleReplySubmit = async (parentId: number) => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!replyText.trim()) return alert('답글 내용을 입력해주세요.');

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`/api/posts/${id}/comments`, { content: replyText, parentId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setReplyText('');
            setReplyingToId(null);
            fetchComments();
        } catch (error) {
            console.error("답글 등록 실패:", error);
            alert("답글을 등록하지 못했습니다.");
        }
    };

    const handleCommentLike = async (comment: CommentType) => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        try {
            const token = localStorage.getItem('access_token');

            if (comment.isLiked) {
                await axios.delete(`/api/posts/${id}/comments/${comment.id}/like`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                await axios.post(`/api/posts/${id}/comments/${comment.id}/like`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            const toggleLike = (c: CommentType) =>
                c.id === comment.id
                    ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
                    : { ...c, replies: c.replies.map(r => r.id === comment.id ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 } : r) };
            setComments(prev => prev.map(toggleLike));
        } catch (error) {
            console.error("댓글 좋아요 처리 실패", error);
        }
    };

    const handlePostLike = async () => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        try {
            const token = localStorage.getItem('access_token');
            if (postLike.isLiked) {
                await axios.delete(`/api/posts/${id}/like`, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`/api/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            }
            setPostLike(prev => ({ count: prev.isLiked ? prev.count - 1 : prev.count + 1, isLiked: !prev.isLiked }));
        } catch (error) {
            console.error('게시글 좋아요 처리 실패:', error);
        }
    };

    if (!post) return <div style={{textAlign: 'center', padding: '100px'}}>포럼 게시글을 불러오는 중입니다...</div>;

    return (
        <div className="community-container">
            <div className="comm-content">
                <main className="comm-main">

                    {/* 🔥 태그 검색 부분 삭제 완료! */}

                    <div className="post-nav-buttons" style={{ marginTop: '20px' }}>
                        <button className="nav-btn">∧ 이전글</button>
                        <button className="nav-btn">∨ 다음글</button>
                        <button className="nav-btn list-btn" onClick={() => navigate('/forum')}>목록</button>
                    </div>

                    <div className="post-detail-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <div className="post-category">📷 {post.brand} &gt; {post.boardType}</div>

                            {isLoggedIn && post.author === userName && !isEditingPost && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="action-btn" onClick={() => setIsEditingPost(true)}>수정</button>
                                    <button className="action-btn delete" onClick={handleDeletePost}>삭제</button>
                                </div>
                            )}
                        </div>

                        {isEditingPost ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                                <input
                                    type="text"
                                    value={editPostTitle}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPostTitle(e.target.value)}
                                    style={{ fontSize: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                                <textarea
                                    value={editPostContent}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditPostContent(e.target.value)}
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
                                        {post.profileUrl
                                            ? <img src={getImageUrl(post.profileUrl)} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '28px', lineHeight: 1 }}>👤</span>}
                                    </div>
                                    <div className="author-details">
                                        <div className="author-name-row">
                                            <span className="author-name">{post.author}</span>
                                        </div>
                                        <div className="author-meta">
                                            <span>{post.date}{post.isEdited && <span style={{ marginLeft: '6px', fontSize: '12px', color: '#999' }}>(수정됨)</span>}</span>
                                            {/* 🔥 조회수 정상 렌더링 */}
                                            <span>조회수 : {post.views}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="post-divider" />

                                <div className="post-body">
                                    {post.images && post.images.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                            {post.images.map((imgUrl, index) => (
                                                <img
                                                    key={index}
                                                    src={getImageUrl(imgUrl)}
                                                    alt={`첨부 이미지 ${index + 1}`}
                                                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{post.content}</div>
                                </div>
                            </>
                        )}

                        <div className="post-footer-actions">
                            <div className="more-posts-link"><span className="author-name-bold">{post.author}</span> 님의 게시글 더보기 &gt;</div>
                            <div className="like-comment-count">
                                <span className={`post-like-btn ${postLike.isLiked ? 'liked' : ''}`} onClick={handlePostLike}>
                                    {postLike.isLiked ? '❤️' : '🤍'} 좋아요 {postLike.count}
                                </span>
                                <span>💬 댓글 {comments.length}</span>
                            </div>
                        </div>

                        {/* 댓글 섹션 */}
                        <div className="comments-section">
                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item" style={{ marginBottom: '15px' }}>
                                    <div className="comment-avatar" style={{ overflow: 'hidden' }}>
                                        {comment.profileUrl
                                            ? <img src={getImageUrl(comment.profileUrl)} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '24px', lineHeight: 1 }}>👤</span>}
                                    </div>
                                    <div className="comment-content">
                                        <div className="comment-author">{comment.author}</div>

                                        {editingCommentId === comment.id ? (
                                            <div className="edit-input-box">
                                                <input value={editCommentText} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditCommentText(e.target.value)} />
                                                <button className="edit-btn" onClick={() => handleEditSave(comment.id)}>저장</button>
                                                <button className="cancel-btn" onClick={() => setEditingCommentId(null)}>취소</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="comment-text">{comment.text}</div>
                                                <div className="comment-date">{comment.date}{comment.isEdited && <span style={{ marginLeft: '6px', fontSize: '12px', color: '#999' }}>(수정됨)</span>}</div>
                                                <div className="comment-actions">
                                                    <button
                                                        className={`action-btn ${comment.isLiked ? 'liked' : ''}`}
                                                        onClick={() => handleCommentLike(comment)}
                                                    >
                                                        {comment.isLiked ? '❤️' : '🤍'} {comment.likes}
                                                    </button>
                                                    {isLoggedIn && (
                                                        <button className="action-btn" onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}>답글</button>
                                                    )}
                                                    {isLoggedIn && comment.author === userName && (
                                                        <>
                                                            <button className="action-btn" onClick={() => startEditing(comment)}>수정</button>
                                                            <button className="action-btn delete" onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* 대댓글 목록 */}
                                        {comment.replies.length > 0 && (
                                            <div style={{ marginTop: '10px', paddingLeft: '20px', borderLeft: '2px solid #eee' }}>
                                                {comment.replies.map(reply => (
                                                    <div key={reply.id} className="comment-item" style={{ marginBottom: '10px' }}>
                                                        <div className="comment-avatar" style={{ overflow: 'hidden', width: '30px', height: '30px' }}>
                                                            {reply.profileUrl
                                                                ? <img src={getImageUrl(reply.profileUrl)} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                : <span style={{ fontSize: '24px', lineHeight: 1 }}>👤</span>}
                                                        </div>
                                                        <div className="comment-content">
                                                            <div className="comment-author">{reply.author}</div>
                                                            <div className="comment-text">{reply.text}</div>
                                                            <div className="comment-date">{reply.date}{reply.isEdited && <span style={{ marginLeft: '6px', fontSize: '12px', color: '#999' }}>(수정됨)</span>}</div>
                                                            <div className="comment-actions">
                                                                <button
                                                                    className={`action-btn ${reply.isLiked ? 'liked' : ''}`}
                                                                    onClick={() => handleCommentLike(reply)}
                                                                >
                                                                    {reply.isLiked ? '❤️' : '🤍'} {reply.likes}
                                                                </button>
                                                                {isLoggedIn && reply.author === userName && (
                                                                    <button className="action-btn delete" onClick={() => handleDeleteComment(reply.id)}>삭제</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 답글 입력창 */}
                                        {replyingToId === comment.id && (
                                            <div style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', gap: '8px' }}>
                                                <input
                                                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                                    placeholder="답글을 입력하세요"
                                                    value={replyText}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setReplyText(e.target.value)}
                                                />
                                                <button className="action-btn" onClick={() => handleReplySubmit(comment.id)}>등록</button>
                                                <button className="cancel-btn" onClick={() => { setReplyingToId(null); setReplyText(''); }}>취소</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="comment-input-box">
                            <div className="comment-input-author">{isLoggedIn ? userName : '로그인 해주세요'}</div>
                            <textarea placeholder={isLoggedIn ? "댓글을 남겨보세요" : "로그인 후 댓글을 작성할 수 있습니다."} value={newComment} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)} disabled={!isLoggedIn}></textarea>
                            <div className="comment-input-bottom">
                                <button className="submit-comment-btn" onClick={handleCommentSubmit}>등록</button>
                            </div>
                        </div>
                    </div>
                </main>
                <aside className="comm-sidebar">
                    <div className="sidebar-box profile-box">
                        <div className="profile-info">
                            {isLoggedIn ? (
                                <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                                    {myProfileUrl ? (
                                        <img src={getImageUrl(myProfileUrl)} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '28px', lineHeight: 1 }}>👤</span>
                                    )}
                                </div>
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
