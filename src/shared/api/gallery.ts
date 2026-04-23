import { apiClient } from './client';

export interface GalleryListItem {
    id: number;
    src: string;
    title: string;
    description?: string;
    author: string;
    tags: string[];
}

export interface CommentItem {
    id: number;
    author: string;
    content: string;
    createdAt: string;
    likeCount: number;
    isLiked: boolean;
}

export interface GalleryDetailItem extends GalleryListItem {
    comments: CommentItem[];
    likeCount: number;
    isLiked: boolean;
}

export interface CreateGalleryPostPayload {
    title: string;
    description: string;
    imageFiles?: File[];
    tagIds?: number[];
}

export interface TagItem {
    id: number;
    name: string;
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
    author?: string;
    authorName?: string;
    nickname?: string;
    content?: string;
    createdAt?: string;
    createdDate?: string;
    likeCount?: number;
    isLiked?: boolean;
};

type RawPost = {
    id?: number;
    postId?: number;
    title?: string;
    content?: string;
    description?: string;
    author?: string;
    nickname?: string;
    imageUrl?: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
    tagNames?: string[];
    tags?: string[] | RawTag[];
    likeCount?: number;
    isLiked?: boolean;
    comments?: RawComment[];
};

type RawPostListResponse = RawPost[] | { content?: RawPost[]; totalPages?: number };

function unwrapData<T>(payload: T | ApiResponse<T>): T {
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in (payload as ApiResponse<T>)
    ) {
        return ((payload as ApiResponse<T>).data ?? []) as T;
    }

    return payload as T;
}

function normalizeTag(raw: RawTag): TagItem {
    return {
        id: raw.id ?? raw.tagId ?? 0,
        name: raw.name ?? raw.tagName ?? '',
    };
}

function extractTagNames(rawTags?: string[] | RawTag[]): string[] {
    if (!rawTags) return [];

    if (rawTags.length === 0) return [];

    if (typeof rawTags[0] === 'string') {
        return rawTags as string[];
    }

    return (rawTags as RawTag[])
        .map((tag) => tag.name ?? tag.tagName ?? '')
        .filter(Boolean);
}

function normalizeComment(raw: RawComment): CommentItem {
    return {
        id: raw.id ?? raw.commentId ?? 0,
        author: raw.authorName ?? raw.author ?? raw.nickname ?? '익명',
        content: raw.content ?? '',
        createdAt: raw.createdAt ?? raw.createdDate ?? '',
        likeCount: raw.likeCount ?? 0,
        isLiked: raw.isLiked ?? false,
    };
}

function normalizeGalleryItem(raw: RawPost): GalleryListItem {
    return {
        id: raw.id ?? raw.postId ?? 0,
        src:
            raw.thumbnailUrl ||
            raw.imageUrl ||
            raw.imageUrls?.[0] ||
            'https://via.placeholder.com/400x500?text=No+Image',
        title: raw.title ?? '',
        description: raw.content ?? raw.description ?? '',
        author: raw.nickname ?? raw.author ?? '익명',
        tags: raw.tagNames ?? extractTagNames(raw.tags),
    };
}

function normalizeGalleryDetail(raw: RawPost): GalleryDetailItem {
    const base = normalizeGalleryItem(raw);

    return {
        ...base,
        likeCount: raw.likeCount ?? 0,
        isLiked: raw.isLiked ?? false,
        comments: (raw.comments ?? []).map(normalizeComment),
    };
}

export interface GalleryListResult {
    items: GalleryListItem[];
    totalPages: number;
}

export async function getGalleryList(page = 0, size = 12): Promise<GalleryListResult> {
    const res = await apiClient.get('/api/posts', {
        params: { board: 'GALLERY', page, size },
    });

    const raw = unwrapData<RawPostListResponse>(res.data);

    if (Array.isArray(raw)) {
        return { items: raw.map(normalizeGalleryItem), totalPages: 1 };
    }

    return {
        items: (raw.content ?? []).map(normalizeGalleryItem),
        totalPages: (raw as { totalPages?: number }).totalPages ?? 1,
    };
}

export async function getGalleryDetail(postId: number): Promise<GalleryDetailItem> {
    const [postRes, commentsRes] = await Promise.all([
        apiClient.get(`/api/posts/${postId}`),
        apiClient.get(`/api/posts/${postId}/comments`).catch(() => ({ data: { data: [] } })),
    ]);
    const raw = unwrapData<RawPost>(postRes.data);
    const detail = normalizeGalleryDetail(raw); // isLiked가 postRes에 포함됨
    const commentsRaw = unwrapData<RawComment[]>(commentsRes.data);
    return {
        ...detail,
        comments: (Array.isArray(commentsRaw) ? commentsRaw : []).map(normalizeComment),
    };
}

export async function createComment(postId: number, content: string): Promise<CommentItem> {
    const res = await apiClient.post(`/api/posts/${postId}/comments`, {
        content,
    });

    const raw = unwrapData<RawComment>(res.data);
    return normalizeComment(raw);
}

export async function toggleGalleryLike(
    postId: number,
    currentIsLiked: boolean,
    currentLikeCount: number,
): Promise<{ likeCount: number; isLiked: boolean }> {
    if (currentIsLiked) {
        await apiClient.delete(`/api/posts/${postId}/like`);
        return { likeCount: Math.max(currentLikeCount - 1, 0), isLiked: false };
    }

    await apiClient.post(`/api/posts/${postId}/like`);
    return { likeCount: currentLikeCount + 1, isLiked: true };
}

export async function toggleCommentLike(
    postId: number,
    comment: CommentItem,
): Promise<CommentItem> {
    if (comment.isLiked) {
        await apiClient.delete(`/api/posts/${postId}/comments/${comment.id}/like`);
        return { ...comment, isLiked: false, likeCount: Math.max(comment.likeCount - 1, 0) };
    }

    await apiClient.post(`/api/posts/${postId}/comments/${comment.id}/like`);
    return { ...comment, isLiked: true, likeCount: comment.likeCount + 1 };
}

export async function getTagList(): Promise<TagItem[]> {
    const res = await apiClient.get('/api/tags');
    const raw = unwrapData<RawTag[]>(res.data);

    return (raw ?? []).map(normalizeTag);
}

export async function getGalleryTagNames(): Promise<string[]> {
    const tags = await getTagList();
    return ['전체', ...tags.map((tag) => tag.name)];
}

export async function recommendTagsByImage(file?: File): Promise<TagItem[]> {
    if (!file) return [];

    const formData = new FormData();
    formData.append('file', file);

    const recommendRes = await apiClient.post('/api/gemini/tags', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const raw = unwrapData<{ tags?: string[] } | string[]>(recommendRes.data);
    const recommendedNames = Array.isArray(raw) ? raw : (raw.tags ?? []);

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

    payload.tagIds?.forEach((tagId) => {
        formData.append('tagIds', String(tagId));
    });

    payload.imageFiles?.forEach((file) => {
        formData.append('images', file);
    });

    const res = await apiClient.post('/api/posts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const raw = unwrapData<RawPost>(res.data);

    return {
        success: true,
        id: raw.id ?? raw.postId ?? 0,
    };
}