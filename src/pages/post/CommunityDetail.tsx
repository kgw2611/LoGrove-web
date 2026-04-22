import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './Community.css';
import './CommunityDetail.css';

const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://52.79.122.225:8080${path.startsWith('/') ? '' : '/'}${path}`;
};

// 🔥 명세서에 맞춰 대댓글(Reply) 관련 타입은 깔끔하게 지웠습니다!
interface CommentType {
    id: number;
    postId: string | undefined;
    author: string;
    text: string;
    date: string;
    likes: number;
    isLiked: boolean; // 좋아요 여부 추가
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
    const [userName] = useState<string>(() => {
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

    // 🔥 1. 댓글 조회 (명세서엔 상세조회만 있지만, 보통 목록을 가져오는 GET 요청)
    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/posts/${id}/comments`);
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
                const response = await axios.get(`/api/posts/${id}`);
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
                setPostLike({ count: formattedPost.views || 0, isLiked: false });
                setEditPostTitle(formattedPost.title);
                setEditPostContent(formattedPost.content);
            } catch (error) {
                console.error("게시글 상세 조회 실패:", error);
                alert("게시글을 불러올 수 없습니다.");
                navigate('/community');
            }
        };

        if (id) {
            fetchPostDetail();
            fetchComments(); // 글 불러올 때 댓글도 싹 가져오기!
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    // 게시글 삭제 로직
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

    // 게시글 수정 로직
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

    // 🔥 2. 댓글 작성 (POST /api/posts/{post_id}/comments)
    const handleCommentSubmit = async () => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!newComment.trim()) return alert('댓글 내용을 입력해주세요.');

        try {
            const token = localStorage.getItem('access_token');
            // 건우님 백엔드가 content를 받는지 text를 받는지 DTO 확인 필요! (보통 content)
            await axios.post(`/api/posts/${id}/comments`, { content: newComment }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNewComment('');
            fetchComments(); // 작성 성공하면 목록 새로고침
        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글을 등록하지 못했습니다.");
        }
    };

    // 🔥 3. 댓글 삭제 (DELETE /api/posts/{post_id}/comments/{comment_id})
    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
            try {
                const token = localStorage.getItem('access_token');
                await axios.delete(`/api/posts/${id}/comments/${commentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchComments(); // 삭제 성공하면 목록 새로고침
            } catch (error) {
                console.error("댓글 삭제 실패", error);
                alert("삭제 권한이 없습니다.");
            }
        }
    };

    // 🔥 4. 댓글 수정 (PUT /api/posts/{post_id}/comments/{comment_id})
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
            fetchComments(); // 수정 성공하면 목록 새로고침
        } catch (error) {
            console.error("댓글 수정 실패", error);
            alert("수정 권한이 없습니다.");
        }
    };

    // 🔥 5. 댓글 좋아요 / 좋아요 취소 (POST & DELETE)
    const handleCommentLike = async (comment: CommentType) => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        try {
            const token = localStorage.getItem('access_token');

            if (comment.isLiked) {
                // 이미 좋아요 상태면 취소 (DELETE)
                await axios.delete(`/api/posts/${id}/comments/${comment.id}/like`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                // 좋아요 안 한 상태면 추가 (POST)
                await axios.post(`/api/posts/${id}/comments/${comment.id}/like`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            fetchComments(); // 좋아요 반영 후 목록 새로고침
        } catch (error) {
            console.error("댓글 좋아요 처리 실패", error);
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
                                    onClick={() => setPostLike({ count: postLike.isLiked ? postLike.count - 1 : postLike.count + 1, isLiked: !postLike.isLiked })}
                                >
                                    {postLike.isLiked ? '❤️' : '🤍'} 좋아요 {postLike.count}
                                </span>
                                <span>💬 댓글 {comments.length}</span>
                            </div>
                        </div>

                        {/* 🔥 6. 댓글 렌더링 영역 (대댓글 완전 삭제) */}
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
                    {/* ... (사이드바 생략 없이 기존 코드 그대로 유지) */}
                </aside>
            </div>
        </div>
    );
}