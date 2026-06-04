import { apiClient } from './client';

export interface CasualResult {
    id: number;
    score: number;
    reason: string;
    scoreReason: string;
    resultUrl: string;
    submittedAt: string;
}

export async function submitCasualPhoto(file: File): Promise<CasualResult> {
    const formData = new FormData();
    formData.append('file', file);

    // 자유 사진 평가는 파일 업로드와 AI 평가가 한 요청에서 처리된다.
    const res = await apiClient.post('/photo/casual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.data ?? res.data;
}
