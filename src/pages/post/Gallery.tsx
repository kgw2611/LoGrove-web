import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../home/Home.css';
import './Gallery.css';
import {
    createComment,
    deleteComment,
    getGalleryDetail,
    getGalleryList,
    getGalleryTagNames,
    toggleCommentLike,
    toggleGalleryLike,
    updateComment,
    type CommentItem,
    type GalleryDetailItem,
    type GalleryListItem,
} from '../../shared/api/gallery';
import axios from "axios";

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
            <path d="M10 12H20" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function HeartIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
    const color = active ? '#7BC9A5' : '#2D2D2D';

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 20.2C11.7 20.2 11.3 20.1 11.1 19.8L4.8 13.9C3.2 12.4 2.5 11.2 2.5 9.5C2.5 6.7 4.6 4.6 7.4 4.6C9 4.6 10.5 5.3 11.5 6.5C12.5 5.3 14 4.6 15.6 4.6C18.4 4.6 20.5 6.7 20.5 9.5C20.5 11.2 19.8 12.4 18.2 13.9L11.9 19.8C11.7 20.1 11.3 20.2 12 20.2Z"
                stroke={color}
                fill={active ? color : 'none'}
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
            <path d="M12 16V4" stroke="#2D2D2D" strokeWidth="1.8" strokeLinecap="round" />
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

function SendIcon({ active = false }: { active?: boolean }) {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 19L20 12L4 5L7 12L4 19Z"
                stroke={active ? '#ffffff' : '#7BC9A5'}
                strokeWidth="1.9"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

function TagArrowIcon({ open }: { open: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d={open ? 'M6 15L12 9L18 15' : 'M6 9L12 15L18 9'}
                stroke="#111"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// 🔥 11번 퀘스트: 갤러리에서 제외할 커뮤니티/포럼 태그 목록 정의
const EXCLUDED_TAGS = [
    '일상', '거래', '정보', '질문', '사진', '출사지', '이벤트', '리뷰',
    '캐논', '소니', '니콘', '후지필름', '라이카', '핫셀블라드', '파나소닉', '올림푸스', '기타', '필름',
    'Canon', 'Sony', 'Nikon', 'Leica', 'Film', 'Fujifilm', 'Hasselblad', 'Olympus', 'Panasonic', '기타(etc)'
];

type PostLikeOverrideMap = Record<number, { isLiked: boolean; likeCount: number }>;

type CommentLikeOverrideMap = Record<
    number,
    Record<number, { isLiked: boolean; likeCount: number }>
>;

function readJSON<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

function safeCount(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function Gallery() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialPostId = searchParams.get('postId');

    const [galleryItems, setGalleryItems] = useState<GalleryListItem[]>([]);
    const [selectedPost, setSelectedPost] = useState<GalleryDetailItem | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [commentInput, setCommentInput] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    const [searchText, setSearchText] = useState('');
    const [tagOptions, setTagOptions] = useState<string[]>(['전체']);
    const [selectedTag, setSelectedTag] = useState('전체');
    const [isTagsVisible, setIsTagsVisible] = useState(true);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [postLikeOverrides, setPostLikeOverrides] = useState<PostLikeOverrideMap>(() =>
        readJSON<PostLikeOverrideMap>('gallery_post_like_overrides', {})
    );

    const [commentLikeOverrides, setCommentLikeOverrides] =
        useState<CommentLikeOverrideMap>(() =>
            readJSON<CommentLikeOverrideMap>('gallery_comment_like_overrides', {})
        );

    const commentSectionRef = useRef<HTMLDivElement | null>(null);
    const commentInputRef = useRef<HTMLInputElement | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const isLoggedIn = !!localStorage.getItem('access_token');
    const isCommentTyping = commentInput.trim().length > 0;
    const hasSearchOrTag = searchText.trim().length > 0 || selectedTag !== '전체';


    // 🔥 서버에서 내 유저 정보(닉네임) 불러와서 연동!
    const [userName, setUserName] = useState<string>(() => {
        const savedUserString = localStorage.getItem('user_db');
        if (savedUserString) {
            const parsedUser = JSON.parse(savedUserString);
            return parsedUser.nickname || parsedUser.name || '';
        }
        return '';
    });
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');

    // 🔥 API 호출 시 profileUrl 데이터도 함께 가져와서 State에 저장!
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
                    setProfileImageUrl(data.profileUrl || ''); // 프로필 이미지 URL 세팅
                } catch (error) {
                    console.error("내 정보 불러오기 실패", error);
                }
            }
        };
        void fetchMyInfo();
    }, []);

    useEffect(() => {
        localStorage.setItem(
            'gallery_post_like_overrides',
            JSON.stringify(postLikeOverrides)
        );
    }, [postLikeOverrides]);

    useEffect(() => {
        localStorage.setItem(
            'gallery_comment_like_overrides',
            JSON.stringify(commentLikeOverrides)
        );
    }, [commentLikeOverrides]);

    useEffect(() => {
        setCurrentPage(0);
        setGalleryItems([]);
        setTotalPages(1);
    }, [searchText, selectedTag]);

    const requireLogin = (message: string) => {
        if (isLoggedIn) return true;

        alert(message);
        navigate('/login');
        return false;
    };

    const mergeLikeOverrides = useCallback(
        (detail: GalleryDetailItem): GalleryDetailItem => {
            const postOverride = postLikeOverrides[detail.id];
            const commentOverrideMap = commentLikeOverrides[detail.id] ?? {};

            return {
                ...detail,
                likeCount: safeCount(postOverride?.likeCount ?? detail.likeCount),
                isLiked: postOverride?.isLiked ?? detail.isLiked ?? false,
                comments: detail.comments.map((comment) => ({
                    ...comment,
                    likeCount: safeCount(
                        commentOverrideMap[comment.id]?.likeCount ?? comment.likeCount
                    ),
                    isLiked:
                        commentOverrideMap[comment.id]?.isLiked ??
                        comment.isLiked ??
                        false,
                })),
            };
        },
        [postLikeOverrides, commentLikeOverrides]
    );

    const syncListItemFromDetail = (detail: GalleryDetailItem) => {
        setGalleryItems((prev) =>
            prev.map((item) =>
                item.id === detail.id
                    ? {
                        ...item,
                        title: detail.title,
                        description: detail.description,
                        src: detail.src,
                        author: detail.author,
                        tags: detail.tags,
                        likeCount: safeCount(detail.likeCount),
                        isLiked: detail.isLiked,
                    }
                    : item
            )
        );
    };

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                if (currentPage === 0) {
                    setIsLoading(true);
                } else {
                    setIsLoadingMore(true);
                }

                const pageSize = hasSearchOrTag ? 200 : 20;

                const [result, tags] = await Promise.all([
                    // @ts-ignore
                    getGalleryList(currentPage, pageSize, {
                        search: searchText,
                        tag: selectedTag,
                    }),
                    // @ts-ignore
                    getGalleryTagNames().catch((tagError) => {
                        console.warn('태그 목록 조회 실패:', tagError);
                        return [];
                    }),
                ]);

                // 🔥 11번 퀘스트: 가져온 태그 목록 중 커뮤니티/포럼 전용 태그 필터링!
                const filteredTags = tags.filter((tag: string) => !EXCLUDED_TAGS.includes(tag) && tag !== '전체');
                setTagOptions(['전체', ...filteredTags]);

                setGalleryItems((prev) => {
                    if (currentPage === 0) return result.items;

                    const merged = [...prev, ...result.items];

                    return Array.from(
                        new Map(merged.map((item) => [item.id, item])).values()
                    );
                });

                setTotalPages(result.totalPages);
            } catch (error) {
                console.error('갤러리 목록 불러오기 실패:', error);

                if (currentPage === 0) {
                    setGalleryItems([]);
                }
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        };

        void fetchGallery();
    }, [currentPage, searchText, selectedTag, hasSearchOrTag]);

    useEffect(() => {
        if (selectedPost) return;
        if (hasSearchOrTag) return;
        if (!loadMoreRef.current) return;
        if (isLoading || isLoadingMore) return;
        if (currentPage >= totalPages - 1) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setCurrentPage((prev) => prev + 1);
                }
            },
            { threshold: 0.25 }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [selectedPost, hasSearchOrTag, isLoading, isLoadingMore, currentPage, totalPages]);

    useEffect(() => {
        if (!initialPostId) return;
        if (selectedPost?.id === Number(initialPostId)) return;

        const openInitialPost = async () => {
            try {
                setIsDetailLoading(true);
                // @ts-ignore
                const detail = await getGalleryDetail(Number(initialPostId));
                const mergedDetail = mergeLikeOverrides(detail);

                setSelectedPost(mergedDetail);
                setCommentInput('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                console.error('갤러리 상세 이동 실패:', error);
            } finally {
                setIsDetailLoading(false);
            }
        };

        void openInitialPost();
    }, [initialPostId, selectedPost?.id, mergeLikeOverrides]);

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
            // @ts-ignore
            const detail = await getGalleryDetail(Number(item.id));
            const mergedDetail = mergeLikeOverrides(detail);

            setSelectedPost(mergedDetail);
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
        navigate('/gallery', { replace: true });
    };

    const handleCreateComment = async () => {
        if (!selectedPost || !commentInput.trim() || isSubmittingComment) return;
        if (!requireLogin('댓글 작성은 로그인 후 이용할 수 있습니다.')) return;

        try {
            setIsSubmittingComment(true);
            // @ts-ignore
            await createComment(
                Number(selectedPost.id),
                commentInput.trim(),
                selectedPost.title
            );
            // @ts-ignore
            const refreshedDetail = await getGalleryDetail(Number(selectedPost.id));
            const mergedDetail = mergeLikeOverrides(refreshedDetail);

            setSelectedPost(mergedDetail);
            setCommentInput('');

            setTimeout(() => {
                commentInputRef.current?.focus();
            }, 100);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await handleCreateComment();
        }
    };

    const handleToggleGalleryLike = async () => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!selectedPost) return;
        if (!requireLogin('좋아요는 로그인 후 이용할 수 있습니다.')) return;

        const previousPost = selectedPost;

        const currentLiked = selectedPost.isLiked;
        const currentCount = safeCount(selectedPost.likeCount);
        const nextLiked = !currentLiked;
        const nextLikeCount = nextLiked ? currentCount + 1 : Math.max(currentCount - 1, 0);

        const updatedPost: GalleryDetailItem = {
            ...selectedPost,
            isLiked: nextLiked,
            likeCount: nextLikeCount,
        };

        setSelectedPost(updatedPost);
        syncListItemFromDetail(updatedPost);

        setPostLikeOverrides((prev) => ({
            ...prev,
            [selectedPost.id]: {
                isLiked: nextLiked,
                likeCount: nextLikeCount,
            },
        }));

        try {
            // @ts-ignore
            await toggleGalleryLike(Number(selectedPost.id), currentLiked);
        } catch (error) {
            console.error('게시글 좋아요 실패:', error);

            setSelectedPost(previousPost);
            syncListItemFromDetail(previousPost);

            setPostLikeOverrides((prev) => ({
                ...prev,
                [previousPost.id]: {
                    isLiked: previousPost.isLiked,
                    likeCount: safeCount(previousPost.likeCount),
                },
            }));
        }
    };

    const handleCreateReply = async (parentId: number) => {
        if (!selectedPost || !replyText.trim() || isSubmittingComment) return;
        if (!requireLogin('답글 작성은 로그인 후 이용할 수 있습니다.')) return;

        try {
            setIsSubmittingComment(true);
            // @ts-ignore
            await createComment(Number(selectedPost.id), replyText.trim(), selectedPost.title, parentId);
            // @ts-ignore
            const refreshedDetail = await getGalleryDetail(Number(selectedPost.id));
            const mergedDetail = mergeLikeOverrides(refreshedDetail);
            setSelectedPost(mergedDetail);
            setReplyText('');
            setReplyingToId(null);
        } catch (error) {
            console.error('답글 작성 실패:', error);
            alert('답글 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleSaveEdit = async (commentId: number) => {
        if (!editCommentText.trim()) return alert('내용을 입력해주세요.');
        if (!selectedPost) return;
        try {
            // @ts-ignore
            await updateComment(Number(selectedPost.id), commentId, editCommentText.trim());
            // @ts-ignore
            const refreshedDetail = await getGalleryDetail(Number(selectedPost.id));
            const mergedDetail = mergeLikeOverrides(refreshedDetail);
            setSelectedPost(mergedDetail);
            setEditingCommentId(null);
            setEditCommentText('');
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            alert('수정 권한이 없습니다.');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!selectedPost) return;
        if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
        try {
            // @ts-ignore
            await deleteComment(Number(selectedPost.id), commentId);
            // @ts-ignore
            const refreshedDetail = await getGalleryDetail(Number(selectedPost.id));
            const mergedDetail = mergeLikeOverrides(refreshedDetail);
            setSelectedPost(mergedDetail);
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert('삭제 권한이 없습니다.');
        }
    };

    const handleToggleCommentLike = async (commentId: number) => {
        if (!isLoggedIn) return alert('로그인 후 이용 가능합니다.');
        if (!selectedPost) return;
        if (!requireLogin('댓글 좋아요는 로그인 후 이용할 수 있습니다.')) return;

        const previousPost = selectedPost;

        const targetComment =
            selectedPost.comments.find((c) => c.id === commentId) ??
            selectedPost.comments.flatMap((c) => c.replies).find((r) => r.id === commentId);

        if (!targetComment) return;

        const currentLiked = targetComment.isLiked;
        const currentCount = safeCount(targetComment.likeCount);
        const nextLiked = !currentLiked;
        const nextLikeCount = nextLiked ? currentCount + 1 : Math.max(currentCount - 1, 0);

        const toggleInList = (comments: typeof selectedPost.comments) =>
            comments.map((comment) =>
                comment.id === commentId
                    ? { ...comment, isLiked: nextLiked, likeCount: nextLikeCount }
                    : { ...comment, replies: comment.replies.map((r) => r.id === commentId ? { ...r, isLiked: nextLiked, likeCount: nextLikeCount } : r) }
            );

        const nextComments = toggleInList(selectedPost.comments);

        setSelectedPost({
            ...selectedPost,
            comments: nextComments,
        });

        setCommentLikeOverrides((prev) => ({
            ...prev,
            [selectedPost.id]: {
                ...(prev[selectedPost.id] ?? {}),
                [commentId]: {
                    isLiked: nextLiked,
                    likeCount: nextLikeCount,
                },
            },
        }));

        try {
            // @ts-ignore
            await toggleCommentLike(Number(selectedPost.id), commentId, currentLiked);
        } catch (error) {
            console.error('댓글 좋아요 실패:', error);

            setSelectedPost(previousPost);

            setCommentLikeOverrides((prev) => ({
                ...prev,
                [previousPost.id]: {
                    ...(prev[previousPost.id] ?? {}),
                    [commentId]: {
                        isLiked: targetComment.isLiked,
                        likeCount: safeCount(targetComment.likeCount),
                    },
                },
            }));
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

                    {/* 🔥 프로필 이미지 표시 로직 추가! */}
                    <button
                        className="gallery-profile-btn"
                        type="button"
                        aria-label="profile"
                        onClick={() => navigate(isLoggedIn ? '/mypage' : '/login')}
                        style={{ padding: 0, overflow: 'hidden', borderRadius: '50%', border: 'none', background: 'none' }}
                    >
                        {isLoggedIn ? (
                            profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt="내 프로필"
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : userName ? (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#00bfa5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                    {getAvatarText(userName)}
                                </div>
                            ) : (
                                <UserIcon />
                            )
                        ) : (
                            <UserIcon />
                        )}
                    </button>

                    <button className="gallery-dropdown-btn" type="button" aria-label="more">
                        <ChevronDownIcon />
                    </button>
                </div>
            </div>

            {!selectedPost && (
                <div className={`gallery-tag-area ${isTagsVisible ? 'open' : 'closed'}`}>
                    <button
                        type="button"
                        className="gallery-tag-collapse-btn"
                        onClick={() => setIsTagsVisible((prev) => !prev)}
                        aria-label={isTagsVisible ? '태그 숨기기' : '태그 펼치기'}
                    >
                        <TagArrowIcon open={isTagsVisible} />
                    </button>

                    {isTagsVisible && (
                        <div className="gallery-tag-bar gallery-tag-bordered">
                            {tagOptions.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`gallery-tag-chip gallery-tag-border-chip ${
                                        selectedTag === tag ? 'active' : ''
                                    }`}
                                    onClick={() => setSelectedTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="gallery-loading-state">
                    <div className="gallery-loading-icon">⏳</div>
                    <p>갤러리 목록을 불러오는 중입니다.</p>
                </div>
            ) : !selectedPost ? (
                galleryItems.length === 0 ? (
                    <div className="gallery-empty-state">
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>📷</div>
                        <h3>검색 결과가 없습니다.</h3>
                        <p>다른 태그나 검색어로 다시 시도해 보세요.</p>
                    </div>
                ) : (
                    <>
                        <main className="masonry-grid">
                            {galleryItems.map((item) => (
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
                                        <span className="masonry-title">
                                            {item.title || ''}
                                        </span>
                                        <span className="masonry-more">…</span>
                                    </div>
                                </article>
                            ))}
                        </main>

                        <div ref={loadMoreRef} className="gallery-load-more-trigger" />

                        {isLoadingMore && (
                            <div className="gallery-load-more-text">
                                사진을 더 불러오는 중입니다...
                            </div>
                        )}
                    </>
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
                                    className={`detail-icon-btn detail-like-btn ${
                                        selectedPost.isLiked ? 'active' : ''
                                    }`}
                                    onClick={handleToggleGalleryLike}
                                >
                                    <HeartIcon active={selectedPost.isLiked} />
                                    <span>{safeCount(selectedPost.likeCount)}</span>
                                </button>

                                <button
                                    type="button"
                                    className="detail-icon-btn"
                                    onClick={handleScrollToComment}
                                >
                                    <CommentIcon />
                                </button>

                                <button
                                    type="button"
                                    className="detail-icon-btn"
                                    onClick={() => {
                                        requireLogin('공유는 로그인 후 이용할 수 있습니다.');
                                    }}
                                >
                                    <ShareIcon />
                                </button>

                                {/* 🔥 18번 퀘스트: 상세페이지 게시글 더보기(MoreIcon) 삭제 완료! */}
                            </div>
                        </div>

                        {isDetailLoading ? (
                            <div className="gallery-detail-loading">
                                게시글을 불러오는 중입니다.
                            </div>
                        ) : (
                            <div className="gallery-detail-card">
                                <div className="gallery-detail-save-wrap">
                                    <button
                                        className="gallery-save-chip"
                                        type="button"
                                        onClick={handleToggleGalleryLike}
                                    >
                                        {selectedPost.isLiked ? '저장됨' : '저장'}
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
                                        <div className="gallery-detail-author-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                            {selectedPost.authorProfileUrl
                                                ? <img src={selectedPost.authorProfileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : getAvatarText(selectedPost.author)}
                                        </div>

                                        <div className="gallery-detail-author-texts">
                                            <div className="gallery-detail-author-name">
                                                {selectedPost.author}
                                            </div>
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
                                                selectedPost.comments.map((comment: CommentItem) => (
                                                    <div key={comment.id}>
                                                        <div className="gallery-detail-comment-item">
                                                            <div className="gallery-detail-comment-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                                                {comment.profileUrl
                                                                    ? <img src={comment.profileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                    : getAvatarText(comment.author)}
                                                            </div>

                                                            <div className="gallery-detail-comment-body">
                                                                <div className="gallery-detail-comment-main">
                                                                    <div className="gallery-detail-comment-author-line">
                                                                        <span className="gallery-detail-comment-author">{comment.author}</span>
                                                                        <span className="gallery-detail-comment-time">{comment.createdAt || '방금'}{comment.isEdited && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#999' }}>(수정됨)</span>}</span>
                                                                    </div>
                                                                    {editingCommentId === comment.id ? (
                                                                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                                                            <input
                                                                                type="text"
                                                                                value={editCommentText}
                                                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSaveEdit(comment.id); }}
                                                                                style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                                                            />
                                                                            <button type="button" onClick={() => handleSaveEdit(comment.id)} style={{ padding: '6px 12px', background: '#7BC9A5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>저장</button>
                                                                            <button type="button" onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} style={{ padding: '6px 12px', background: '#eee', color: '#555', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>취소</button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="gallery-detail-comment-text">{comment.content}</div>
                                                                            <div className="gallery-detail-comment-meta">
                                                                                <button
                                                                                    type="button"
                                                                                    className="gallery-comment-reply-btn"
                                                                                    onClick={() => { setReplyingToId(replyingToId === comment.id ? null : comment.id); setReplyText(''); }}
                                                                                >
                                                                                    답변
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`comment-like-btn ${comment.isLiked ? 'active' : ''}`}
                                                                                    onClick={() => handleToggleCommentLike(comment.id)}
                                                                                >
                                                                                    <HeartIcon active={comment.isLiked} size={18} />
                                                                                    <span>{safeCount(comment.likeCount)}</span>
                                                                                </button>
                                                                                {isLoggedIn && comment.author === userName && (
                                                                                    <>
                                                                                        <button type="button" onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>수정</button>
                                                                                        <button type="button" onClick={() => handleDeleteComment(comment.id)} style={{ fontSize: '12px', color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>삭제</button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 대댓글 목록 */}
                                                        {comment.replies.length > 0 && (
                                                            <div style={{ paddingLeft: '44px', marginTop: '4px' }}>
                                                                {comment.replies.map((reply) => (
                                                                    <div key={reply.id} className="gallery-detail-comment-item" style={{ marginBottom: '8px' }}>
                                                                        <div className="gallery-detail-comment-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                                                            {reply.profileUrl
                                                                                ? <img src={reply.profileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                                : getAvatarText(reply.author)}
                                                                        </div>
                                                                        <div className="gallery-detail-comment-body">
                                                                            <div className="gallery-detail-comment-main">
                                                                                <div className="gallery-detail-comment-author-line">
                                                                                    <span className="gallery-detail-comment-author">{reply.author}</span>
                                                                                    <span className="gallery-detail-comment-time">{reply.createdAt || '방금'}{reply.isEdited && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#999' }}>(수정됨)</span>}</span>
                                                                                </div>
                                                                                {editingCommentId === reply.id ? (
                                                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editCommentText}
                                                                                            onChange={(e) => setEditCommentText(e.target.value)}
                                                                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSaveEdit(reply.id); }}
                                                                                            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                                                                        />
                                                                                        <button type="button" onClick={() => handleSaveEdit(reply.id)} style={{ padding: '6px 12px', background: '#7BC9A5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>저장</button>
                                                                                        <button type="button" onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} style={{ padding: '6px 12px', background: '#eee', color: '#555', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>취소</button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="gallery-detail-comment-text">{reply.content}</div>
                                                                                        <div className="gallery-detail-comment-meta">
                                                                                            <button
                                                                                                type="button"
                                                                                                className={`comment-like-btn ${reply.isLiked ? 'active' : ''}`}
                                                                                                onClick={() => handleToggleCommentLike(reply.id)}
                                                                                            >
                                                                                                <HeartIcon active={reply.isLiked} size={18} />
                                                                                                <span>{safeCount(reply.likeCount)}</span>
                                                                                            </button>
                                                                                            {isLoggedIn && reply.author === userName && (
                                                                                                <>
                                                                                                    <button type="button" onClick={() => { setEditingCommentId(reply.id); setEditCommentText(reply.content); }} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>수정</button>
                                                                                                    <button type="button" onClick={() => handleDeleteComment(reply.id)} style={{ fontSize: '12px', color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>삭제</button>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* 답변 입력창 */}
                                                        {replyingToId === comment.id && (
                                                            <div style={{ paddingLeft: '44px', marginTop: '4px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCreateReply(comment.id); }}
                                                                    placeholder="답변을 입력하세요"
                                                                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', fontSize: '13px', outline: 'none' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCreateReply(comment.id)}
                                                                    style={{ padding: '8px 14px', background: '#7BC9A5', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}
                                                                >
                                                                    등록
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                                                    style={{ padding: '8px 14px', background: '#eee', color: '#555', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div
                                            className={`gallery-detail-comment-input-wrap gallery-comment-input-image-style ${
                                                isCommentTyping ? 'typing' : ''
                                            }`}
                                        >
                                            <input
                                                ref={commentInputRef}
                                                type="text"
                                                className="gallery-detail-comment-input"
                                                placeholder={
                                                    isLoggedIn
                                                        ? isSubmittingComment
                                                            ? '등록 중...'
                                                            : '댓글 추가'
                                                        : '로그인 후 댓글을 작성할 수 있습니다.'
                                                }
                                                value={commentInput}
                                                onFocus={() => {
                                                    if (!isLoggedIn) {
                                                        requireLogin(
                                                            '댓글 작성은 로그인 후 이용할 수 있습니다.'
                                                        );
                                                    }
                                                }}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                onKeyDown={handleCommentKeyDown}
                                                readOnly={!isLoggedIn}
                                                disabled={isSubmittingComment}
                                            />

                                            <button
                                                type="button"
                                                className={`gallery-comment-send-btn ${
                                                    isCommentTyping ? 'active' : ''
                                                }`}
                                                onClick={handleCreateComment}
                                                disabled={
                                                    !isLoggedIn ||
                                                    !isCommentTyping ||
                                                    isSubmittingComment
                                                }
                                                aria-label="댓글 등록"
                                            >
                                                <SendIcon active={isCommentTyping} />
                                            </button>
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
                                        <span className="gallery-related-title">
                                            {item.title || ''}
                                        </span>
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
