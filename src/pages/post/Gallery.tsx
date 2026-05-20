import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type MouseEventHandler,
} from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ColumnsPhotoAlbum, type Photo } from 'react-photo-album';
import 'react-photo-album/columns.css';
import '../home/Home.css';
import './Gallery.css';
import {
    createComment,
    deleteGalleryPost,
    deleteComment,
    getGalleryDetail,
    getGalleryList,
    getGalleryNeighbors,
    getGalleryTagNames,
    toggleCommentLike,
    toggleGalleryLike,
    updateComment,
    updateGalleryPost,
    type CommentItem,
    type GalleryDetailItem,
    type GalleryListItem,
    type NeighborPostsResult,
} from '../../shared/api/gallery';
import { getLevelColor } from '../../shared/utils/levelColor';
import { getValidToken } from '../../shared/utils/auth';
import GalleryFilmstrip from './GalleryFilmstrip';
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

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M2 12C4 7 7.5 4.5 12 4.5C16.5 4.5 20 7 22 12C20 17 16.5 19.5 12 19.5C7.5 19.5 4 17 2 12Z"
                stroke="#6F6F6F"
                strokeWidth="1.8"
            />
            <circle cx="12" cy="12" r="3" stroke="#6F6F6F" strokeWidth="1.8" />
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

// 🔥 우측 V자 토글 버튼용 아이콘
function ChevronIcon({ open = false }: { open?: boolean }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
                transition: 'transform 0.3s ease',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
        >
            <path
                d="M19 9L12 16L5 9"
                stroke="#6F6F6F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

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

const GALLERY_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x500?text=No+Image';

type GalleryPhoto = Photo & {
    item: GalleryListItem;
};

const getGalleryColumns = (containerWidth: number | undefined) => {
    if (!containerWidth || containerWidth < 600) return 1;
    if (containerWidth < 900) return 2;
    if (containerWidth < 1200) return 3;
    return 4;
};

const getGallerySpacing = (containerWidth: number | undefined) => {
    return containerWidth && containerWidth < 600 ? 8 : 18;
};

function GalleryPhotoCard({
                              photo,
                              width,
                              height,
                              onClick,
                          }: {
    photo: GalleryPhoto;
    width: number;
    height: number;
    onClick?: MouseEventHandler;
}) {
    const item = photo.item;

    return (
        <div className="gallery-photo-card" style={{ width, height }} onClick={onClick}>
            <img
                src={photo.src}
                alt={photo.alt ?? item.title ?? 'gallery photo'}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                onError={(e) => {
                    if (e.currentTarget.src !== GALLERY_PLACEHOLDER_IMAGE) {
                        e.currentTarget.src = GALLERY_PLACEHOLDER_IMAGE;
                    }
                }}
            />
            <div className="gallery-photo-overlay">
                <span className="gallery-photo-title">{item.title || '제목 없음'}</span>
                <span className="gallery-photo-meta">
                    <span
                        className="gallery-photo-level"
                        style={{ backgroundColor: getLevelColor(item.authorLevel) }}
                    >
                        Lv.{item.authorLevel ?? 1}
                    </span>
                    <span>♡ {safeCount(item.likeCount)}</span>
                    <span>👁 {safeCount(item.view)}</span>
                </span>
            </div>
        </div>
    );
}

function GalleryPhotoSkeleton({ height }: { height: number }) {
    return <div className="gallery-photo-skeleton" style={{ height }} />;
}

function formatCommentDate(iso?: string) {
    if (!iso) return '방금';

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('ko-KR');
}

export default function Gallery() {
    const navigate = useNavigate();
    const { id: paramId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const initialPostId = paramId ?? searchParams.get('postId');

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
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [searchInput, setSearchInput] = useState('');
    const [searchText, setSearchText] = useState('');

    // 태그 배열 상태
    const [tagOptions, setTagOptions] = useState<string[]>([]);

    // 다중 선택 상태
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // 🔥 태그 펼치기/접기 상태 (기본값 열려있음)
    const [isTagsVisible, setIsTagsVisible] = useState(true);

    const [scrollY, setScrollY] = useState(0);

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

    const isLoggedIn = !!getValidToken();
    const isCommentTyping = commentInput.trim().length > 0;

    // 검색어나 선택된 태그가 하나라도 있는지 확인
    const hasSearchOrTag = searchText.trim().length > 0 || selectedTags.length > 0;

    const [userName, setUserName] = useState<string>(() => {
        const savedUserString = localStorage.getItem('user_db');
        if (savedUserString) {
            const parsedUser = JSON.parse(savedUserString);
            return parsedUser.nickname || parsedUser.name || '';
        }
        return '';
    });
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');
    const isSelectedPostAuthor =
        !!selectedPost &&
        !!userName &&
        selectedPost.author.trim().toLowerCase() === userName.trim().toLowerCase();

    const photos = useMemo<GalleryPhoto[]>(
        () =>
            galleryItems.map((item) => ({
                src: item.src,
                width: item.width || 4,
                height: item.height || 5,
                alt: item.title || item.description || 'gallery photo',
                item,
            })),
        [galleryItems]
    );

    const skeletonPhotos = useMemo<Photo[]>(
        () =>
            Array.from({ length: 12 }).map((_, index) => ({
                src: GALLERY_PLACEHOLDER_IMAGE,
                width: 4,
                height: [4, 5, 6, 5, 4][index % 5],
                alt: '',
            })),
        []
    );

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
                    setProfileImageUrl(data.profileUrl || '');
                } catch (error) {
                    console.error("내 정보 불러오기 실패", error);
                }
            }
        };
        void fetchMyInfo();
    }, []);

    useEffect(() => {
        if (!paramId) {
            setSelectedPost(null);
            setCommentInput('');
            setIsEditingPost(false);
        }
    }, [paramId]);

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

    // 검색어 혹은 태그 변경 시 페이지 초기화
    useEffect(() => {
        setCurrentPage(0);
        setGalleryItems([]);
        setTotalPages(1);
    }, [searchText, selectedTags]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (selectedPost) return;

        const saved = sessionStorage.getItem('gallery_scroll');
        if (!saved) return;

        requestAnimationFrame(() => {
            window.scrollTo(0, Number(saved));
            sessionStorage.removeItem('gallery_scroll');
        });
    }, [selectedPost]);

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
                        width: detail.width,
                        height: detail.height,
                        author: detail.author,
                        tags: detail.tags,
                        likeCount: safeCount(detail.likeCount),
                        view: safeCount(detail.view),
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

                // 🔥 텅 비어있을 때는 API에 '전체'라고 보내줘야 전체 사진이 나옵니다!
                const tagQueryParam = selectedTags.length > 0 ? selectedTags.join(',') : '전체';

                const [result, tags] = await Promise.all([
                    getGalleryList(currentPage, pageSize, {
                        search: searchText,
                        tag: tagQueryParam,
                    }),
                    getGalleryTagNames().catch((tagError) => {
                        console.warn('태그 목록 조회 실패:', tagError);
                        return [];
                    }),
                ]);

                const filteredTags = tags.filter((tag: string) => !EXCLUDED_TAGS.includes(tag) && tag !== '전체');
                setTagOptions(filteredTags);

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
    }, [currentPage, searchText, selectedTags, hasSearchOrTag]);

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
                const detail = await getGalleryDetail(Number(initialPostId));
                const mergedDetail = mergeLikeOverrides(detail);

                setSelectedPost(mergedDetail);
                setCommentInput('');
                setIsEditingPost(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                console.error('갤러리 상세 이동 실패:', error);
            } finally {
                setIsDetailLoading(false);
            }
        };

        void openInitialPost();
    }, [initialPostId, selectedPost?.id, mergeLikeOverrides]);

    const [neighbors, setNeighbors] = useState<NeighborPostsResult | null>(null);

    useEffect(() => {
        if (!selectedPost) {
            setNeighbors(null);
            return;
        }

        setNeighbors(null);
        getGalleryNeighbors(selectedPost.id, 2)
            .then(setNeighbors)
            .catch((error) => {
                console.error('Failed to load gallery neighbors:', error);
                setNeighbors({ newer: [], older: [] });
            });
    }, [selectedPost?.id]);

    const openDetail = async (item: GalleryListItem) => {
        sessionStorage.setItem('gallery_scroll', String(window.scrollY));
        navigate(`/gallery/${item.id}`);
        try {
            setIsDetailLoading(true);
            const detail = await getGalleryDetail(Number(item.id));
            const mergedDetail = mergeLikeOverrides(detail);

            setSelectedPost(mergedDetail);
            setCommentInput('');
            setIsEditingPost(false);
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
        setIsEditingPost(false);
        navigate('/gallery', { replace: true });
    };

    const handleStartEditPost = () => {
        if (!selectedPost) return;

        setEditTitle(selectedPost.title);
        setEditDescription(selectedPost.description ?? '');
        setIsEditingPost(true);
    };

    const handleCancelEditPost = () => {
        setIsEditingPost(false);
        setEditTitle('');
        setEditDescription('');
    };

    const handleSaveEditPost = async () => {
        if (!selectedPost) return;
        if (!editTitle.trim()) return alert('제목을 입력해주세요.');
        if (!editDescription.trim()) return alert('내용을 입력해주세요.');

        try {
            await updateGalleryPost(selectedPost.id, {
                title: editTitle.trim(),
                content: editDescription.trim(),
            });
            const refreshed = await getGalleryDetail(selectedPost.id);
            const mergedDetail = mergeLikeOverrides(refreshed);

            setSelectedPost(mergedDetail);
            syncListItemFromDetail(mergedDetail);
            handleCancelEditPost();
        } catch (error) {
            console.error('게시글 수정 실패:', error);
            alert('게시글 수정 중 오류가 발생했습니다.');
        }
    };

    const handleDeletePost = async () => {
        if (!selectedPost) return;
        if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

        try {
            await deleteGalleryPost(selectedPost.id);
            setGalleryItems((prev) => prev.filter((item) => item.id !== selectedPost.id));
            closeDetail();
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCreateComment = async () => {
        if (!selectedPost || !commentInput.trim() || isSubmittingComment) return;
        if (!requireLogin('댓글 작성은 로그인 후 이용할 수 있습니다.')) return;

        try {
            setIsSubmittingComment(true);
            await createComment(
                Number(selectedPost.id),
                commentInput.trim(),
                selectedPost.title
            );
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
            await createComment(Number(selectedPost.id), replyText.trim(), selectedPost.title, parentId);
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
            await updateComment(Number(selectedPost.id), commentId, editCommentText.trim());
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
            await deleteComment(Number(selectedPost.id), commentId);
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

    const handleTagToggle = (tag: string) => {
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter((t) => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
        setSearchInput('');
        setSearchText('');
    };

    return (
        <div className="gallery-container">

            {/* 🔥 상단 검색창 영역: V버튼을 포함하여 모든 동작을 위로 올림 */}
            <div
                style={{
                    position: 'sticky',
                    top: '64px',
                    zIndex: 100,
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #eaeaea',
                    marginTop: '-40px',
                    marginLeft: 'calc(-50vw + 50%)',
                    marginRight: 'calc(-50vw + 50%)',
                    paddingLeft: 'calc(50vw - 50%)',
                    paddingRight: 'calc(50vw - 50%)',
                    boxSizing: 'border-box',
                    paddingTop: '15px',

                    /* 🔥 아랫부분과 완전히 붙이도록 패딩과 마진을 확 줄임 */
                    paddingBottom: '13px',
                    marginBottom: '13px',
                    transition: 'all 0.3s ease',
                }}
            >
                <div className="gallery-sub-header" style={{ marginBottom: '0' }}>
                    <div className="search-bar-wrapper">
                        <span className="gallery-search-icon">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search for..."
                            className="gallery-search-input"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setSearchText(searchInput.trim());
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="gallery-search-submit"
                            onClick={() => setSearchText(searchInput.trim())}
                            aria-label="검색"
                        >
                            <SearchIcon />
                        </button>
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

                        {/* 🔥 천재적인 발상! V자 토글 버튼을 검색창 윗줄로 이사옴 (프로필 자리) */}
                        {!selectedPost && (
                            <button
                                type="button"
                                className="gallery-tag-area-toggle-btn"
                                onClick={() => setIsTagsVisible(prev => !prev)}
                                aria-label={isTagsVisible ? '태그 영역 닫기' : '태그 영역 열기'}
                            >
                                <ChevronIcon open={isTagsVisible} />
                            </button>
                        )}

                        {/* 🔥 프로필은 V버튼 오른쪽 끝으로 밀려남 */}
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
                    </div>
                </div>

                {!selectedPost && (
                    /* 🔥 태그 영역: V버튼이 윗줄로 갔으므로, 태그를 닫으면 높이가 0px로 완벽히 사라짐! */
                    <div className="gallery-tag-area">
                        <div className={`gallery-tag-bar-collapse ${isTagsVisible ? 'open' : 'closed'}`}>
                            <div className="gallery-tag-bar gallery-tag-bordered">
                                {tagOptions.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className={`gallery-tag-chip gallery-tag-border-chip ${
                                            selectedTags.includes(tag) ? 'active' : ''
                                        }`}
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <ColumnsPhotoAlbum
                    photos={skeletonPhotos}
                    columns={getGalleryColumns}
                    spacing={getGallerySpacing}
                    render={{
                        photo: (_props, { height }) => (
                            <GalleryPhotoSkeleton height={height} />
                        ),
                    }}
                />
            ) : !selectedPost ? (
                galleryItems.length === 0 ? (
                    <div className="gallery-empty-state">
                        <div className="gallery-empty-illustration">◎</div>
                        <h3>검색 결과가 없습니다.</h3>
                        <p>다른 태그나 검색어로 다시 시도해 보세요.</p>
                        <button
                            type="button"
                            className="gallery-empty-reset-btn"
                            onClick={() => {
                                setSelectedTags([]);
                                setSearchInput('');
                                setSearchText('');
                            }}
                        >
                            전체 보기
                        </button>
                    </div>
                ) : (
                    <>
                        <ColumnsPhotoAlbum
                            photos={photos}
                            columns={getGalleryColumns}
                            spacing={getGallerySpacing}
                            onClick={({ photo }) => openDetail(photo.item)}
                            render={{
                                photo: ({ onClick }, { photo, width, height }) => (
                                    <GalleryPhotoCard
                                        photo={photo}
                                        width={width}
                                        height={height}
                                        onClick={onClick}
                                    />
                                ),
                            }}
                        />
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
                            </div>
                        </div>

                        {isDetailLoading ? (
                            <div className="gallery-detail-loading">
                                게시글을 불러오는 중입니다.
                            </div>
                        ) : (
                            <div className="gallery-detail-card">
                                <div className="gallery-detail-view-info">
                                    <EyeIcon />
                                    <span>{safeCount(selectedPost.view)}</span>
                                </div>

                                <div className="gallery-detail-image-wrap">
                                    <img
                                        src={selectedPost.src}
                                        alt={selectedPost.title}
                                        className="gallery-detail-image"
                                    />
                                </div>

                                <div className="gallery-detail-content">
                                    {isEditingPost ? (
                                        <input
                                            className="gallery-post-edit-title-input"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="제목"
                                        />
                                    ) : (
                                        <h2 className="gallery-detail-title">
                                            {selectedPost.title || '제목 없음'}
                                        </h2>
                                    )}

                                    <div className="gallery-detail-tag-list">
                                        {selectedPost.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="gallery-detail-tag"
                                                onClick={() => {
                                                    setSelectedTags([tag]);
                                                    setSearchInput('');
                                                    setSearchText('');
                                                    closeDetail();
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="gallery-detail-author-row">
                                        <div className="gallery-detail-author-avatar" style={{ overflow: 'hidden', padding: 0, borderColor: getLevelColor(selectedPost.authorLevel) }}>
                                            {selectedPost.authorProfileUrl
                                                ? <img src={selectedPost.authorProfileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : getAvatarText(selectedPost.author)}
                                        </div>

                                        <div className="gallery-detail-author-texts">
                                            <div className="gallery-detail-author-name">
                                                {selectedPost.author}
                                                <span
                                                    className="level-badge-chip"
                                                    style={{ backgroundColor: getLevelColor(selectedPost.authorLevel) }}
                                                >
                                                    Lv.{selectedPost.authorLevel ?? 1}
                                                </span>
                                            </div>
                                            <div className="gallery-detail-author-time">
                                                {selectedPost.createdAt
                                                    ? new Date(selectedPost.createdAt).toLocaleDateString('ko-KR')
                                                    : ''}
                                            </div>
                                        </div>

                                        {isSelectedPostAuthor && (
                                            <div className="gallery-post-owner-actions">
                                                {isEditingPost ? (
                                                    <>
                                                        <button type="button" onClick={handleSaveEditPost}>저장</button>
                                                        <button type="button" onClick={handleCancelEditPost}>취소</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" onClick={handleStartEditPost}>수정</button>
                                                        <button type="button" className="delete" onClick={handleDeletePost}>삭제</button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isEditingPost ? (
                                        <textarea
                                            className="gallery-post-edit-description-input"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="내용"
                                        />
                                    ) : (
                                        <p className="gallery-detail-description">
                                            {selectedPost.description || '설명이 없습니다.'}
                                        </p>
                                    )}

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
                                                            <div className="gallery-detail-comment-avatar" style={{ overflow: 'hidden', padding: 0, borderColor: getLevelColor(comment.authorLevel) }}>
                                                                {comment.profileUrl
                                                                    ? <img src={comment.profileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                    : getAvatarText(comment.author)}
                                                            </div>

                                                            <div className="gallery-detail-comment-body">
                                                                <div className="gallery-detail-comment-main">
                                                                    <div className="gallery-detail-comment-author-line">
                                                                        <span className="gallery-detail-comment-author">{comment.author}</span>
                                                                        <span
                                                                            className="level-badge-chip"
                                                                            style={{ backgroundColor: getLevelColor(comment.authorLevel) }}
                                                                        >
                                                                            Lv.{comment.authorLevel ?? 1}
                                                                        </span>
                                                                        <span className="gallery-detail-comment-time">{formatCommentDate(comment.createdAt)}{comment.isEdited && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#999' }}>(수정됨)</span>}</span>
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
                                                                        <div className="gallery-detail-comment-avatar" style={{ overflow: 'hidden', padding: 0, borderColor: getLevelColor(reply.authorLevel) }}>
                                                                            {reply.profileUrl
                                                                                ? <img src={reply.profileUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                                : getAvatarText(reply.author)}
                                                                        </div>
                                                                        <div className="gallery-detail-comment-body">
                                                                            <div className="gallery-detail-comment-main">
                                                                                <div className="gallery-detail-comment-author-line">
                                                                                    <span className="gallery-detail-comment-author">{reply.author}</span>
                                                                                    <span
                                                                                        className="level-badge-chip"
                                                                                        style={{ backgroundColor: getLevelColor(reply.authorLevel) }}
                                                                                    >
                                                                                        Lv.{reply.authorLevel ?? 1}
                                                                                    </span>
                                                                                    <span className="gallery-detail-comment-time">{formatCommentDate(reply.createdAt)}{reply.isEdited && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#999' }}>(수정됨)</span>}</span>
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
                        <GalleryFilmstrip
                            currentPost={selectedPost}
                            neighbors={neighbors}
                            onSelect={openDetail}
                        />
                    </aside>
                </div>
            )}

            {scrollY > 800 && (
                <button
                    type="button"
                    className="gallery-scroll-top-btn"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="맨 위로 이동"
                >
                    ↑
                </button>
            )}
        </div>
    );
}
