import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { Link } from 'react-router-dom';
import '../home/Home.css';
import './Gallery.css';
import {
    getGalleryList,
    getGalleryDetail,
    createComment,
    toggleGalleryLike,
    toggleCommentLike,
    getGalleryTagNames,
    type GalleryListItem,
    type GalleryDetailItem,
} from '../../shared/api/gallery';

function SearchIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#6F6F6F" strokeWidth="2" />
            <path d="M20 20L16.65 16.65" stroke="#6F6F6F" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function WritingIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.4 18.5 6.6L17.4 5.5C16.6 4.7 15.3 4.7 14.5 5.5L4 16V20Z"
                stroke="#4E5A53"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path d="M13.5 6.5L17.5 10.5" stroke="#4E5A53" strokeWidth="1.8" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="#B7BBC2" strokeWidth="1.8" />
            <path
                d="M5 19C6.3 16.7 8.7 15.5 12 15.5C15.3 15.5 17.7 16.7 19 19"
                stroke="#B7BBC2"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6 9L12 15L18 9"
                stroke="#444"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M15 6L9 12L15 18"
                stroke="#2D2D2D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 12H20"
                stroke="#2D2D2D"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function HeartIcon({
                       active = false,
                       size = 24,
                   }: {
    active?: boolean;
    size?: number;
}) {
    const color = active ? '#7BC9A5' : '#2D2D2D';

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 20.2C11.7 20.2 11.3 20.1 11.1 19.8L4.8 13.9C3.2 12.4 2.5 11.2 2.5 9.5C2.5 6.7 4.6 4.6 7.4 4.6C9 4.6 10.5 5.3 11.5 6.5C12.5 5.3 14 4.6 15.6 4.6C18.4 4.6 20.5 6.7 20.5 9.5C20.5 11.2 19.8 12.4 18.2 13.9L11.9 19.8C11.7 20.1 11.3 20.2 12 20.2Z"
                stroke={color}
                fill={active ? '#E8F7F0' : 'none'}
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CommentIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6 18L4.5 20V6.8C4.5 5.8 5.3 5 6.3 5H17.7C18.7 5 19.5 5.8 19.5 6.8V14.2C19.5 15.2 18.7 16 17.7 16H8L6 18Z"
                stroke="#2D2D2D"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ShareIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 16V4"
                stroke="#2D2D2D"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M8 8L12 4L16 8"
                stroke="#2D2D2D"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M5 14.5V17.2C5 18.2 5.8 19 6.8 19H17.2C18.2 19 19 18.2 19 17.2V14.5"
                stroke="#2D2D2D"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="12" r="1.2" fill="#2D2D2D" />
            <circle cx="12" cy="12" r="1.2" fill="#2D2D2D" />
            <circle cx="17.5" cy="12" r="1.2" fill="#2D2D2D" />
        </svg>
    );
}

function SmileIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="#2D2D2D" strokeWidth="1.8" />
            <circle cx="9" cy="10" r="1" fill="#2D2D2D" />
            <circle cx="15" cy="10" r="1" fill="#2D2D2D" />
            <path
                d="M8.5 14.5C9.4 15.5 10.5 16 12 16C13.5 16 14.6 15.5 15.5 14.5"
                stroke="#2D2D2D"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function StickerIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="4"
                stroke="#2D2D2D"
                strokeWidth="1.8"
            />
            <path
                d="M15 20C15 17.2 17.2 15 20 15"
                stroke="#2D2D2D"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <circle cx="9" cy="10" r="1" fill="#2D2D2D" />
            <circle cx="15" cy="10" r="1" fill="#2D2D2D" />
            <path
                d="M8.7 14.2C9.5 14.9 10.5 15.3 12 15.3C13.5 15.3 14.5 14.9 15.3 14.2"
                stroke="#2D2D2D"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ImageIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
                x="3.5"
                y="5"
                width="17"
                height="14"
                rx="2.5"
                stroke="#2D2D2D"
                strokeWidth="1.8"
            />
            <circle cx="9" cy="10" r="1.4" fill="#2D2D2D" />
            <path
                d="M6.5 16L10.3 12.4C10.7 12 11.3 12 11.7 12.4L14 14.7"
                stroke="#2D2D2D"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M12.8 13.8L14.4 12.2C14.8 11.8 15.4 11.8 15.8 12.2L18 14.4"
                stroke="#2D2D2D"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function Gallery() {
    const [galleryItems, setGalleryItems] = useState<GalleryListItem[]>([]);
    const [selectedPost, setSelectedPost] = useState<GalleryDetailItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [tagOptions, setTagOptions] = useState<string[]>(['전체']);
    const [selectedTag, setSelectedTag] = useState('전체');

    const commentSectionRef = useRef<HTMLDivElement | null>(null);
    const commentInputRef = useRef<HTMLInputElement | null>(null);

    const isLoggedIn =
        !!localStorage.getItem('access_token');

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                setIsLoading(true);
                const [items, tags] = await Promise.all([
                    getGalleryList(),
                    getGalleryTagNames(),
                ]);
                setGalleryItems(items);
                setTagOptions(tags);
            } catch (error) {
                console.error('갤러리 목록 불러오기 실패:', error);
                setGalleryItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGallery();
    }, []);

    const filteredGalleryItems = useMemo(() => {
        return galleryItems
            .filter((item) => {
                const matchesTag =
                    selectedTag === '전체' || item.tags.includes(selectedTag);

                const query = searchText.trim().toLowerCase();
                const matchesSearch =
                    query.length === 0 ||
                    item.title.toLowerCase().includes(query) ||
                    (item.description ?? '').toLowerCase().includes(query) ||
                    item.tags.some((tag) => tag.toLowerCase().includes(query));

                return matchesTag && matchesSearch;
            })
            .slice()
            .sort((a, b) => Number(b.id) - Number(a.id));
    }, [galleryItems, selectedTag, searchText]);

    const relatedItems = useMemo(() => {
        if (!selectedPost) return [];

        return galleryItems
            .filter((item) => item.id !== selectedPost.id)
            .slice()
            .sort((a, b) => Number(b.id) - Number(a.id))
            .slice(0, 4);
    }, [galleryItems, selectedPost]);

    const openDetail = async (item: GalleryListItem) => {
        try {
            setIsDetailLoading(true);
            const detail = await getGalleryDetail(Number(item.id));
            setSelectedPost(detail);
            setCommentInput('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('상세 조회 실패:', error);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedPost(null);
        setCommentInput('');
    };

    const handleCreateComment = async () => {
        if (!selectedPost || !commentInput.trim() || isSubmittingComment) return;

        try {
            setIsSubmittingComment(true);

            await createComment(Number(selectedPost.id), commentInput.trim());

            const refreshedDetail = await getGalleryDetail(Number(selectedPost.id));
            setSelectedPost(refreshedDetail);

            setCommentInput('');

            setTimeout(() => {
                commentInputRef.current?.focus();
            }, 100);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (isSubmittingComment) return;

            await handleCreateComment();
        }
    };

    const handleToggleGalleryLike = async () => {
        if (!selectedPost) return;

        try {
            const updated = await toggleGalleryLike(Number(selectedPost.id));

            setSelectedPost((prev) =>
                prev
                    ? {
                        ...prev,
                        likeCount: updated.likeCount,
                        isLiked: updated.isLiked,
                    }
                    : prev
            );
        } catch (error) {
            console.error('게시글 좋아요 실패:', error);
        }
    };

    const handleToggleCommentLike = async (commentId: number) => {
        if (!selectedPost) return;

        try {
            const updatedComment = await toggleCommentLike(Number(selectedPost.id), commentId);

            setSelectedPost((prev) =>
                prev
                    ? {
                        ...prev,
                        comments: prev.comments.map((comment) =>
                            comment.id === updatedComment.id ? updatedComment : comment
                        ),
                    }
                    : prev
            );
        } catch (error) {
            console.error('댓글 좋아요 실패:', error);
        }
    };

    const handleScrollToComment = () => {
        commentSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });

        setTimeout(() => {
            commentInputRef.current?.focus();
        }, 350);
    };

    const getAvatarText = (name?: string) => {
        if (!name) return 'B';
        return name.trim().charAt(0).toUpperCase();
    };

    return (
        <div className="gallery-container">
            <div className="gallery-sub-header">
                <div className="search-bar-wrapper">
          <span className="gallery-search-icon">
            <SearchIcon />
          </span>
                    <input
                        type="text"
                        placeholder="Search for..."
                        className="gallery-search-input"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <div className="gallery-actions">
                    <Link
                        to={isLoggedIn ? '/gallery/write' : '/login'}
                        className="gallery-write-link"
                    >
                        <button className="gallery-write-btn" type="button">
                            <WritingIcon />
                            <span>writing</span>
                        </button>
                    </Link>

                    <button className="gallery-profile-btn" type="button" aria-label="profile">
                        <UserIcon />
                    </button>

                    <button className="gallery-dropdown-btn" type="button" aria-label="more">
                        <ChevronDownIcon />
                    </button>
                </div>
            </div>

            {!selectedPost && (
                <div className="gallery-tag-bar">
                    {tagOptions.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={`gallery-tag-chip ${selectedTag === tag ? 'active' : ''}`}
                            onClick={() => setSelectedTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {isLoading ? (
                <div className="gallery-loading-state">
                    <div className="gallery-loading-icon">⏳</div>
                    <p>갤러리 목록을 불러오는 중입니다.</p>
                </div>
            ) : !selectedPost ? (
                filteredGalleryItems.length === 0 ? (
                    <div className="gallery-empty-state">
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>📷</div>
                        <h3>검색 결과가 없습니다.</h3>
                        <p>다른 태그나 검색어로 다시 시도해 보세요.</p>
                    </div>
                ) : (
                    <main className="masonry-grid">
                        {filteredGalleryItems.map((item) => (
                            <article
                                className="masonry-item"
                                key={item.id}
                                onClick={() => openDetail(item)}
                            >
                                <img
                                    src={item.src}
                                    alt={item.title || item.description || 'gallery image'}
                                    className="masonry-img"
                                />
                                <div className="masonry-info">
                                    <span className="masonry-title">{item.title || ''}</span>
                                    <span className="masonry-more">…</span>
                                </div>
                            </article>
                        ))}
                    </main>
                )
            ) : (
                <div className="gallery-detail-layout">
                    <section className="gallery-detail-main">
                        <div className="gallery-detail-top-icons">
                            <button type="button" className="detail-icon-btn" onClick={closeDetail}>
                                <BackIcon />
                            </button>

                            <div className="detail-left-actions">
                                <button
                                    type="button"
                                    className={`detail-icon-btn detail-like-btn ${selectedPost.isLiked ? 'active' : ''}`}
                                    onClick={handleToggleGalleryLike}
                                >
                                    <HeartIcon active={selectedPost.isLiked} />
                                    <span>{selectedPost.likeCount}</span>
                                </button>

                                <button
                                    type="button"
                                    className="detail-icon-btn"
                                    onClick={handleScrollToComment}
                                >
                                    <CommentIcon />
                                </button>

                                <button type="button" className="detail-icon-btn">
                                    <ShareIcon />
                                </button>

                                <button type="button" className="detail-icon-btn">
                                    <MoreIcon />
                                </button>
                            </div>
                        </div>

                        {isDetailLoading ? (
                            <div className="gallery-detail-loading">게시글을 불러오는 중입니다.</div>
                        ) : (
                            <div className="gallery-detail-card">
                                <div className="gallery-detail-save-wrap">
                                    <button className="gallery-save-chip" type="button">
                                        저장
                                    </button>
                                </div>

                                <div className="gallery-detail-image-wrap">
                                    <img
                                        src={selectedPost.src}
                                        alt={selectedPost.title}
                                        className="gallery-detail-image"
                                    />
                                </div>

                                <div className="gallery-detail-content">
                                    <h2 className="gallery-detail-title">
                                        {selectedPost.title || '제목 없음'}
                                    </h2>

                                    <div className="gallery-detail-tag-list">
                                        {selectedPost.tags.map((tag) => (
                                            <span key={tag} className="gallery-detail-tag">
                        #{tag}
                      </span>
                                        ))}
                                    </div>

                                    <div className="gallery-detail-author-row">
                                        <div className="gallery-detail-author-avatar">
                                            {getAvatarText(selectedPost.author)}
                                        </div>

                                        <div className="gallery-detail-author-texts">
                                            <div className="gallery-detail-author-name">{selectedPost.author}</div>
                                            <div className="gallery-detail-author-time">1년</div>
                                        </div>
                                    </div>

                                    <p className="gallery-detail-description">
                                        {selectedPost.description || '설명이 없습니다.'}
                                    </p>

                                    <div className="gallery-detail-divider" />

                                    <div
                                        className="gallery-detail-comment-section"
                                        ref={commentSectionRef}
                                    >
                                        <div className="gallery-detail-comment-count">
                                            댓글 {selectedPost.comments.length}개
                                        </div>

                                        <div className="gallery-detail-comments-list">
                                            {selectedPost.comments.length === 0 ? (
                                                <div className="gallery-detail-comment-empty">
                                                    아직 댓글이 없습니다.
                                                </div>
                                            ) : (
                                                selectedPost.comments.map((comment) => (
                                                    <div key={comment.id} className="gallery-detail-comment-item">
                                                        <div className="gallery-detail-comment-avatar">
                                                            {getAvatarText(comment.author)}
                                                        </div>

                                                        <div className="gallery-detail-comment-body">
                                                            <div className="gallery-detail-comment-main">
                                                                <div className="gallery-detail-comment-author-line">
                                  <span className="gallery-detail-comment-author">
                                    {comment.author}
                                  </span>
                                                                    <span className="gallery-detail-comment-time">
                                    {comment.createdAt}
                                  </span>
                                                                </div>

                                                                <div className="gallery-detail-comment-text">
                                                                    {comment.content}
                                                                </div>

                                                                <div className="gallery-detail-comment-meta">
                                                                    <span>답변</span>

                                                                    <button
                                                                        type="button"
                                                                        className={`comment-like-btn ${comment.isLiked ? 'active' : ''}`}
                                                                        onClick={() => handleToggleCommentLike(comment.id)}
                                                                    >
                                                                        <HeartIcon active={comment.isLiked} size={18} />
                                                                        <span>{comment.likeCount}</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <button type="button" className="detail-comment-more-btn">
                                                                <MoreIcon />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="gallery-detail-comment-input-wrap">
                                            <input
                                                ref={commentInputRef}
                                                type="text"
                                                className="gallery-detail-comment-input"
                                                placeholder={isSubmittingComment ? '등록 중...' : '댓글 추가'}
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                onKeyDown={handleCommentKeyDown}
                                                disabled={isSubmittingComment}
                                            />

                                            <div className="gallery-detail-comment-tools">
                                                <button type="button" className="detail-tool-btn">
                                                    <SmileIcon />
                                                </button>
                                                <button type="button" className="detail-tool-btn">
                                                    <StickerIcon />
                                                </button>
                                                <button type="button" className="detail-tool-btn">
                                                    <ImageIcon />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="gallery-detail-side">
                        <div className="gallery-related-grid">
                            {relatedItems.map((item) => (
                                <article
                                    key={item.id}
                                    className="gallery-related-item"
                                    onClick={() => openDetail(item)}
                                >
                                    <img
                                        src={item.src}
                                        alt={item.title || item.description || 'related image'}
                                        className="gallery-related-image"
                                    />
                                    <div className="gallery-related-footer">
                                        <span className="gallery-related-title">{item.title || ''}</span>
                                        <span className="gallery-related-more">…</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}