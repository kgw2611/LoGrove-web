import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './CommunityDetail.css';

const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `/api${path.startsWith('/') ? '' : '/'}${path}`;
};

interface CommentType {
    id: number;
    postId: string | undefined;
    author: string;
    text: string;
    date: string;
    likes: number;
    isLiked: boolean;
}

interface PostType {
    id: number | string;
    title: string;
    content: string;
    author: string;
    tag: string;
    date: string;
    views: number;
    images?: string[];
}

export default function CommunityDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<PostType | null>(null);

    const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('access_token'));

    // 🔥 해결 1: 이름을 바꿀 수 있도록 setUserName을 부활시킵니다!
    const [userName, setUserName] = useState<string>(() => {
        const savedUserString = localStorage.getItem('user_db');
        if (savedUserString) {
            const parsedUser = JSON.parse(savedUserString);
            return parsedUser.nickname || parsedUser.name || '';
        }
        return '';
    });

    const [isEditingPost, setIsEditingPost] = useState<boolean>(false);
    const [editPostTitle, setEditPostTitle] = useState<string>('');
    const [editPostContent, setEditPostContent] = useState<string>('');

    const [postLike, setPostLike] = useState<{ count: number; isLiked: boolean }>({ count: 0, isLiked: false });

    // 댓글 상태
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`/api/posts/${id}/comments`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = response.data.data || response.data || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedComments: CommentType[] = data.map((c: any) => ({
                id: c.id || c.commentId,
                postId: id,
                author: c.authorName || c.nickname || '익명',
                text: c.content || c.text,
                date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '방금 전',
                likes: c.likeCount || c.likes || 0,
                isLiked: c.isLiked || false
            }));
            setComments(formattedComments);
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

                const formattedPost: PostType = {
                    id: data.id || data.postId,
                    title: data.title,
                    content: data.content,
                    author: data.authorName || data.author || data.nickname || '익명',
                    tag: data.tagName || data.tag || data.boardType || 'COMMUNITY',
                    date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '방금 전',
                    views: data.viewCount || data.views || 0,
                    images: data.images || data.imageUrls || data.postImages || [],
                };

                setPost(formattedPost);
                setEditPostTitle(formattedPost.title);
                setEditPostContent(formattedPost.content);
                // isLiked가 게시글 상세 응답에 포함되어 별도 /like API 호출 불필요
                setPostLike({ count: data.likeCount || 0, isLiked: data.isLiked || false });
            } catch (error) {
                console.error("게시글 상세 조회 실패:", error);
                alert("게시글을 불러올 수 없습니다.");
                navigate('/community');
            }
        };

        // 🔥 해결 2: 내 진짜 닉네임을 서버에서 쫙 당겨와서 일치시킵니다!
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
                }
            }
        };

        if (id) {
            fetchPostDetail();
            fetchComments();
        }

        fetchMyInfo(); // 함수 실행!

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    // 게시글 삭제
    const handleDeletePost = async () => {
        if (window.confirm('정말 이 게시글을 삭제하시겠습니까? (댓글도 함께 사라집니다)')) {
            try {
                const token = localStorage.getItem('access_token');
                await axios.delete(`/api/posts/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('게시글이 삭제되었습니다.');
                navigate('/community');
            } catch (error) {
                console.error("게시글 삭제 실패:", error);
                alert("삭제에 실패했습니다. 본인이 작성한 글인지 확인해주세요.");
            }
        }
    };

    // 게시글 수정
    const handleSavePost = async () => {
        if (!editPostTitle.trim() || !editPostContent.trim()) {
            return alert('제목과 내용을 모두 입력해주세요.');
        }

        try {
            const token = localStorage.getItem('access_token');
            const requestData = { title: editPostTitle, content: editPostContent, boardType: 'COMMUNITY' };

            await axios.put(`/api/posts/${id}`, requestData, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (post) setPost({ ...post, title: editPostTitle, content: editPostContent });
            setIsEditingPost(false);
            alert('게시글이 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            alert("수정에 실패했습니다. 본인이 작성한 글인지 확인해주세요.");
        }
    };

    // 댓글 작성
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

    // 댓글 삭제
    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
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

    // 댓글 수정
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

    // 🔥 5. 댓글 좋아요 / 좋아요 취소 — 게시글 좋아요와 동일한 optimistic update 패턴
    const handleCommentLike = async (comment: CommentType) => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        const token = localStorage.getItem('access_token');
        try {
            if (comment.isLiked) {
                await axios.delete(`/api/posts/${id}/comments/${comment.id}/like`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`/api/posts/${id}/comments/${comment.id}/like`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            // API 성공 후 즉시 로컬 상태 반영 (re-fetch 없이)
            setComments(prev => prev.map(c =>
                c.id === comment.id
                    ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
                    : c
            ));
        } catch (error) {
            console.error("댓글 좋아요 처리 실패", error);
        }
    };

    // 게시글 좋아요
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

    if (!post) return <div style={{textAlign: 'center', padding: '100px'}}>게시글을 불러오는 중입니다...</div>;
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
                        <button className="nav-btn list-btn" onClick={() => navigate('/community')}>목록</button>
                    </div>

                    <div className="post-detail-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <div className="post-category">{post.tag} &gt;</div>

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
                                    <span style={{fontWeight: 'bold', marginRight: '8px'}}>[일반]</span>{post.title}
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
                                <span
                                    className={`post-like-btn ${postLike.isLiked ? 'liked' : ''}`}
                                    onClick={handlePostLike}
                                >
                                    {postLike.isLiked ? '❤️' : '🤍'} 좋아요 {postLike.count}
                                </span>
                                <span>💬 댓글 {comments.length}</span>
                            </div>
                        </div>

                        <div className="comments-section">
                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item" style={{ marginBottom: '15px' }}>
                                    <div className="comment-avatar" style={{ overflow: 'hidden' }}>
                                        <img src={profileImgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                                <div className="comment-date">{comment.date}</div>
                                                <div className="comment-actions">
                                                    <button
                                                        className={`action-btn ${comment.isLiked ? 'liked' : ''}`}
                                                        onClick={() => handleCommentLike(comment)}
                                                    >
                                                        {comment.isLiked ? '❤️' : '🤍'} {comment.likes}
                                                    </button>
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
                            ))}
                        </div>

                        <div className="comment-input-box">
                            <div className="comment-input-author">{isLoggedIn ? userName : '로그인 해주세요'}</div>
                            <textarea placeholder={isLoggedIn ? "댓글을 남겨보세요" : "로그인 후 댓글을 작성할 수 있습니다."} value={newComment} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)} disabled={!isLoggedIn}></textarea>
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
                </aside>
            </div>
        </div>
    );
}
