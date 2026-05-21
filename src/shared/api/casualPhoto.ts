import { apiClient } from './client';

export interface CasualResult {
    id: number;
    score: number;
    reason: string;
    resultUrl: string;
    submittedAt: string;
}

export async function submitCasualPhoto(file: File): Promise<CasualResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/photo/casual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.data ?? res.data;
}
