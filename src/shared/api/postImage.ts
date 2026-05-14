import { apiClient } from './client';

type UploadInlineImageResponse = {
    data?: {
        url?: string;
    };
    url?: string;
};

export async function uploadInlineImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await apiClient.post<UploadInlineImageResponse>('/posts/images', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const url = res.data.data?.url ?? res.data.url;
    if (!url) {
        throw new Error('이미지 업로드 응답에 URL이 없습니다.');
    }

    return url;
}
