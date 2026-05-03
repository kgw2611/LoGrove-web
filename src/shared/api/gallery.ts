import axios from 'axios';
import { apiClient } from './client';

export const EXCLUDED_GALLERY_TAG_NAMES = [
    'canon',
    '캐논',
    'sony',
    '소니',
    'nikon',
    '니콘',
    'leica',
    '라이카',
    'fujifilm',
    '후지필름',
    'hasselblad',
    '핫셀블라드',
    '하셀블라드',
    'olympus',
    '올림푸스',
    'panasonic',
    '파나소닉',
    '기타',
    '기타(etc)',
    'etc',
    'film',
    '필름',
    '인기순위',
    '일상',
    '거래',
    '정보',
    '질문',
    '사진',
    '출사지',
    '이벤트',
    '리뷰',
];

export interface GalleryListItem {
    id: number;
    src: string;
    title: string;
    description?: string;
    author: string;
    authorProfileUrl?: string;
    tags: string[];
    likeCount: number;
    isLiked: boolean;
    createdAt?: string;
}

export interface CommentItem {
    id: number;
    postId?: number;
    postTitle?: string;
    author: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    likeCount: number;
    isLiked: boolean;
    profileUrl?: string;
    replies: CommentItem[];
}

export interface GalleryDetailItem extends GalleryListItem {
    comments: CommentItem[];
}

export interface CreateGalleryPostPayload {
    title: string;
    description: string;
    imageFiles?: File[];
    tagIds?: number[];
    commentEnabled?: boolean;
    shareEnabled?: boolean;
}

export interface TagItem {
    id: number;
    name: string;
}

export interface GalleryListResult {
    items: GalleryListItem[];
    totalPages: number;
}

export interface GalleryListOptions {
    search?: string;
    tag?: string;
}

export interface MyGalleryCommentItem {
    id: number;
    postId: number;
    postTitle: string;
    content: string;
    createdAt: string;
}

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type RawTag = {
    id?: number;
    tagId?: number;
    name?: string;
    tagName?: string;
};

type RawComment = {
    id?: number;
    commentId?: number;
    postId?: number;
    postTitle?: string;
    title?: string;
    author?: string;
    nickname?: string;
    content?: string;
    text?: string;
    createdAt?: string;
    createdDate?: string;
    likeCount?: number | string;
    likes?: number | string;
    isLiked?: boolean;
    liked?: boolean;
    updatedAt?: string;
    profileUrl?: string;
    replies?: RawComment[];
};

type RawPost = {
    id?: number;
    postId?: number;
    title?: string;
    content?: string;
    description?: string;
    author?: string;
    nickname?: string;
    profileUrl?: string;
    imageUrl?: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
    tags?: string[] | RawTag[];
    tagNames?: string[];
    likeCount?: number | string;
    likes?: number | string;
    isLiked?: boolean;
    liked?: boolean;
    createdAt?: string;
    createdDate?: string;
    comments?: RawComment[];
};

type RawPostListResponse =
    | RawPost[]
    | {
    content?: RawPost[];
    totalPages?: number;
};

type RawCommentListResponse =
    | RawComment[]
    | {
    content?: RawComment[];
};

const MY_GALLERY_POSTS_KEY = 'my_gallery_posts';
const MY_GALLERY_COMMENTS_KEY = 'my_gallery_comments';

function unwrapData<T>(payload: T | ApiResponse<T>): T {
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in (payload as ApiResponse<T>)
    ) {
        return (payload as ApiResponse<T>).data as T;
    }

    return payload as T;
}

function safeNumber(value: unknown, fallback = 0): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeTagName(name: string) {
    return name.trim().toLowerCase();
}

export function isExcludedGalleryTag(name: string) {
    return EXCLUDED_GALLERY_TAG_NAMES.map(normalizeTagName).includes(
        normalizeTagName(name)
    );
}

function normalizeTag(raw: RawTag): TagItem {
    return {
        id: safeNumber(raw.id ?? raw.tagId),
        name: raw.name ?? raw.tagName ?? '',
    };
}

function extractTagNames(rawTags?: string[] | RawTag[]): string[] {
    if (!rawTags || rawTags.length === 0) return [];

    if (typeof rawTags[0] === 'string') {
        return (rawTags as string[])
            .filter(Boolean)
            .filter((tag) => !isExcludedGalleryTag(tag));
    }

    return (rawTags as RawTag[])
        .map((tag) => tag.name ?? tag.tagName ?? '')
        .filter(Boolean)
        .filter((tag) => !isExcludedGalleryTag(tag));
}

function normalizeImageUrl(raw?: string) {
    if (!raw) return 'https://via.placeholder.com/400x500?text=No+Image';
    return raw;
}

function normalizeComment(raw: RawComment, fallbackPostId?: number): CommentItem {
    const isEdited = !!(raw.updatedAt && raw.createdAt && raw.updatedAt !== raw.createdAt);
    return {
        id: safeNumber(raw.id ?? raw.commentId, Date.now()),
        postId: safeNumber(raw.postId ?? fallbackPostId, fallbackPostId ?? 0),
        postTitle: raw.postTitle ?? raw.title ?? '',
        author: raw.nickname ?? raw.author ?? '익명',
        content: raw.content ?? raw.text ?? '',
        createdAt: isEdited ? raw.updatedAt! : (raw.createdAt ?? raw.createdDate ?? ''),
        isEdited,
        likeCount: safeNumber(raw.likeCount ?? raw.likes),
        isLiked: Boolean(raw.isLiked ?? raw.liked ?? false),
        profileUrl: raw.profileUrl ?? undefined,
        replies: (raw.replies ?? []).map((r) => normalizeComment(r, fallbackPostId)),
    };
}

function normalizeGalleryItem(raw: RawPost): GalleryListItem {
    const id = safeNumber(raw.id ?? raw.postId);

    return {
        id,
        src: normalizeImageUrl(raw.thumbnailUrl || raw.imageUrl || raw.imageUrls?.[0]),
        title: raw.title ?? '',
        description: raw.content ?? raw.description ?? '',
        author: raw.nickname ?? raw.author ?? '익명',
        authorProfileUrl: raw.profileUrl ?? undefined,
        tags: raw.tagNames
            ? raw.tagNames.filter((tag) => !isExcludedGalleryTag(tag))
            : extractTagNames(raw.tags),
        likeCount: safeNumber(raw.likeCount ?? raw.likes),
        isLiked: Boolean(raw.isLiked ?? raw.liked ?? false),
        createdAt: raw.createdAt ?? raw.createdDate ?? '',
    };
}

function normalizeGalleryDetail(
    raw: RawPost,
    commentsOverride?: CommentItem[]
): GalleryDetailItem {
    const base = normalizeGalleryItem(raw);

    return {
        ...base,
        comments:
            commentsOverride ??
            (raw.comments ?? []).map((comment) => normalizeComment(comment, base.id)),
    };
}

function getCurrentUserNameCandidates() {
    return [
        localStorage.getItem('nickname'),
        localStorage.getItem('userName'),
        localStorage.getItem('username'),
        localStorage.getItem('name'),
    ]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase());
}

function getCurrentUserName() {
    return (
        localStorage.getItem('nickname') ||
        localStorage.getItem('userName') ||
        localStorage.getItem('username') ||
        localStorage.getItem('name') ||
        '익명'
    );
}

function isMine(author?: string) {
    if (!author) return false;

    const candidates = getCurrentUserNameCandidates();
    if (candidates.length === 0) return false;

    return candidates.includes(author.trim().toLowerCase());
}

function readLocalArray<T>(key: string): T[] {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function writeLocalArray<T>(key: string, list: T[]) {
    localStorage.setItem(key, JSON.stringify(list));
}

function saveMyGalleryPostLocal(post: GalleryListItem) {
    const list = readLocalArray<GalleryListItem>(MY_GALLERY_POSTS_KEY);

    const next = [post, ...list].filter(
        (item, index, array) => array.findIndex((target) => target.id === item.id) === index
    );

    writeLocalArray(MY_GALLERY_POSTS_KEY, next);
}

function saveMyGalleryCommentLocal(comment: MyGalleryCommentItem) {
    const list = readLocalArray<MyGalleryCommentItem>(MY_GALLERY_COMMENTS_KEY);

    const next = [comment, ...list].filter(
        (item, index, array) => array.findIndex((target) => target.id === item.id) === index
    );

    writeLocalArray(MY_GALLERY_COMMENTS_KEY, next);
}

export function getMyGalleryCommentsLocal(): MyGalleryCommentItem[] {
    return readLocalArray<MyGalleryCommentItem>(MY_GALLERY_COMMENTS_KEY);
}

export function getMyGalleryPostsLocal(): GalleryListItem[] {
    return readLocalArray<GalleryListItem>(MY_GALLERY_POSTS_KEY);
}

export async function getGalleryList(
    page = 0,
    size = 20,
    options?: GalleryListOptions
): Promise<GalleryListResult> {
    const params: Record<string, string | number> = {
        board: 'GALLERY',
        page,
        size,
    };

    if (options?.search?.trim()) {
        params.keyword = options.search.trim();
        params.search = options.search.trim();
    }

    if (options?.tag && options.tag !== '전체') {
        params.tag = options.tag;
        params.tagName = options.tag;
    }

    const res = await apiClient.get('/posts', { params });
    const raw = unwrapData<RawPostListResponse>(res.data);

    let items: GalleryListItem[];
    let totalPages = 1;

    if (Array.isArray(raw)) {
        items = raw.map(normalizeGalleryItem);
    } else {
        items = (raw?.content ?? []).map(normalizeGalleryItem);
        totalPages = raw?.totalPages ?? 1;
    }

    const keyword = options?.search?.trim().toLowerCase() ?? '';
    const selectedTag = options?.tag ?? '전체';

    const filteredItems = items.filter((item) => {
        const tagMatched =
            selectedTag === '전체' || item.tags.some((tag) => tag === selectedTag);

        const searchMatched =
            !keyword ||
            item.title.toLowerCase().includes(keyword) ||
            (item.description ?? '').toLowerCase().includes(keyword) ||
            item.tags.some((tag) => tag.toLowerCase().includes(keyword));

        return tagMatched && searchMatched;
    });

    return {
        items: filteredItems,
        totalPages,
    };
}

export async function getComments(postId: number): Promise<CommentItem[]> {
    const res = await apiClient.get(`/posts/${postId}/comments`);
    const raw = unwrapData<RawCommentListResponse>(res.data);

    if (Array.isArray(raw)) {
        return raw.map((comment) => normalizeComment(comment, postId));
    }

    return (raw?.content ?? []).map((comment) => normalizeComment(comment, postId));
}

export async function getGalleryDetail(postId: number): Promise<GalleryDetailItem> {
    const [postRes, comments] = await Promise.all([
        apiClient.get(`/posts/${postId}`),
        getComments(postId).catch(() => []),
    ]);

    const raw = unwrapData<RawPost>(postRes.data);

    return normalizeGalleryDetail(raw, comments);
}

export async function createComment(
    postId: number,
    content: string,
    postTitle = '',
    parentId?: number
): Promise<CommentItem> {
    const body: Record<string, unknown> = { content };
    if (parentId != null) body.parentId = parentId;
    const res = await apiClient.post(`/posts/${postId}/comments`, body);
    const raw = unwrapData<unknown>(res.data);

    let comment: CommentItem;

    if (raw && typeof raw === 'object') {
        comment = normalizeComment(raw as RawComment, postId);
    } else {
        comment = {
            id: Date.now(),
            postId,
            postTitle,
            author: getCurrentUserName(),
            content,
            createdAt: new Date().toISOString(),
            isEdited: false,
            likeCount: 0,
            isLiked: false,
            replies: [],
        };
    }

    if (!comment.content) {
        comment.content = content;
    }

    if (!comment.postTitle) {
        comment.postTitle = postTitle;
    }

    saveMyGalleryCommentLocal({
        id: comment.id,
        postId,
        postTitle,
        content: comment.content,
        createdAt: comment.createdAt || new Date().toISOString(),
    });

    return comment;
}

export async function updateComment(
    postId: number,
    commentId: number,
    content: string
): Promise<void> {
    await apiClient.put(`/posts/${postId}/comments/${commentId}`, { content });
}

export async function deleteComment(
    postId: number,
    commentId: number
): Promise<void> {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function toggleGalleryLike(
    postId: number,
    currentLiked: boolean
): Promise<void> {
    try {
        if (currentLiked) {
            await apiClient.delete(`/posts/${postId}/like`);
        } else {
            await apiClient.post(`/posts/${postId}/like`);
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            return;
        }

        throw error;
    }
}

export async function toggleCommentLike(
    postId: number,
    commentId: number,
    currentLiked: boolean
): Promise<void> {
    try {
        if (currentLiked) {
            await apiClient.delete(`/posts/${postId}/comments/${commentId}/like`);
        } else {
            await apiClient.post(`/posts/${postId}/comments/${commentId}/like`);
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            return;
        }

        throw error;
    }
}

export async function getTagList(): Promise<TagItem[]> {
    const res = await apiClient.get('/tags');
    const raw = unwrapData<RawTag[]>(res.data);

    return (raw ?? [])
        .map(normalizeTag)
        .filter((tag) => tag.id > 0 && tag.name)
        .filter((tag) => !isExcludedGalleryTag(tag.name));
}

export async function getGalleryTagNames(): Promise<string[]> {
    const tags = await getTagList();
    return ['전체', ...tags.map((tag) => tag.name)];
}

export async function recommendTagsByImage(file?: File): Promise<TagItem[]> {
    if (!file) return [];

    const formData = new FormData();
    formData.append('file', file);

    const recommendRes = await apiClient.post('/gemini/tags', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const raw = unwrapData<{ tags?: string[] } | string[]>(recommendRes.data);
    const recommendedNames = Array.isArray(raw) ? raw : raw.tags ?? [];

    const allTags = await getTagList();

    return allTags.filter((tag) => recommendedNames.includes(tag.name));
}

export async function createGalleryPost(
    payload: CreateGalleryPostPayload
): Promise<{ success: boolean; id: number }> {
    const formData = new FormData();

    formData.append('title', payload.title);
    formData.append('content', payload.description);
    formData.append('boardType', 'GALLERY');
    formData.append('commentEnabled', String(payload.commentEnabled ?? true));
    formData.append('shareEnabled', String(payload.shareEnabled ?? true));
    formData.append('commentAllowed', String(payload.commentEnabled ?? true));
    formData.append('shareAllowed', String(payload.shareEnabled ?? true));

    payload.tagIds?.forEach((tagId) => {
        formData.append('tagIds', String(tagId));
    });

    payload.imageFiles?.forEach((file) => {
        formData.append('images', file);
    });

    const res = await apiClient.post('/posts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const raw = unwrapData<RawPost>(res.data);
    const id = safeNumber(raw?.id ?? raw?.postId);

    saveMyGalleryPostLocal({
        id,
        src: payload.imageFiles?.[0]
            ? URL.createObjectURL(payload.imageFiles[0])
            : 'https://via.placeholder.com/400x500?text=No+Image',
        title: payload.title,
        description: payload.description,
        author: getCurrentUserName(),
        tags: [],
        likeCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
    });

    return {
        success: true,
        id,
    };
}

export async function getMyGalleryPosts(): Promise<GalleryListItem[]> {
    const localPosts = getMyGalleryPostsLocal();

    try {
        const result = await getGalleryList(0, 200);
        const serverPosts = result.items.filter((item) => isMine(item.author));

        return Array.from(
            new Map([...localPosts, ...serverPosts].map((post) => [post.id, post])).values()
        );
    } catch {
        return localPosts;
    }
}