import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCasualPhoto, type CasualResult } from '../../shared/api/casualPhoto';
import './CasualPhotoModal.css';

type Step = 'upload' | 'evaluating' | 'result';

interface CasualPhotoModalProps {
    onClose: () => void;
}

export default function CasualPhotoModal({ onClose }: CasualPhotoModalProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<CasualResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!selected.type.startsWith('image/')) {
            alert('이미지 파일만 선택할 수 있어요.');
            return;
        }

        setFile(selected);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selected);
    };

    const handleSubmit = async () => {
        if (!file) {
            alert('사진을 먼저 선택해 주세요.');
            return;
        }

        setStep('evaluating');
        try {
            const response = await submitCasualPhoto(file);
            setResult(response);
            setStep('result');
        } catch (error) {
            console.error('자유 채점 실패:', error);
            alert('평가 중 오류가 발생했어요. 다시 시도해 주세요.');
            setStep('upload');
        }
    };

    const handleRetry = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setStep('upload');
    };

    const handleOpenMyPage = () => {
        onClose();
        navigate('/mypage', { state: { tab: 'gallery' } });
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return '#21a179';
        if (score >= 70) return '#4f8f39';
        if (score >= 40) return '#c47d21';
        return '#c2415d';
    };

    const getGrade = (score: number) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 50) return 'C';
        return 'D';
    };

    return (
        <div className="casual-modal-overlay" onClick={onClose}>
            <section
                className="casual-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="casual-modal-title"
            >
                <div className="casual-modal-header">
                    <h3 id="casual-modal-title">자유 사진 채점</h3>
                    <button type="button" className="casual-modal-close" onClick={onClose}>
                        x
                    </button>
                </div>

                {step === 'upload' && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="casual-file-input"
                            onChange={handleFileChange}
                        />
                        {preview ? (
                            <button
                                type="button"
                                className="casual-preview"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <img src={preview} alt="미리보기" />
                                <span className="casual-preview-overlay">다른 사진 선택</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="casual-upload-area"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="casual-upload-icon">+</span>
                                <span>사진 선택</span>
                            </button>
                        )}
                        <p className="casual-modal-hint">
                            AI 코멘트는 결과 화면에서 확인할 수 있고, 사진은 마이페이지 갤러리에 저장됩니다.
                        </p>
                        <div className="casual-modal-actions">
                            <button type="button" className="casual-btn-cancel" onClick={onClose}>
                                취소
                            </button>
                            <button
                                type="button"
                                className="casual-btn-submit"
                                onClick={handleSubmit}
                                disabled={!file}
                            >
                                채점 받기
                            </button>
                        </div>
                    </>
                )}

                {step === 'evaluating' && (
                    <div className="casual-loading">
                        <div className="casual-spinner" />
                        <p>AI가 구도와 사진 기법을 살펴보는 중입니다.</p>
                    </div>
                )}

                {step === 'result' && result && (
                    <>
                        <div className="casual-result-image">
                            <img src={preview ?? result.resultUrl} alt="평가 사진" />
                        </div>
                        <div className="casual-result-panel">
                            <div className="casual-result-summary">
                                <span
                                    className="casual-result-grade"
                                    style={{ color: getScoreColor(result.score) }}
                                >
                                    {getGrade(result.score)}
                                </span>
                                <div
                                    className="casual-result-score"
                                    style={{ color: getScoreColor(result.score) }}
                                >
                                    {result.score}점
                                </div>
                            </div>
                            <div className="casual-result-saved">마이페이지 갤러리에 저장됨</div>
                            <div className="casual-result-comment">
                                <span>AI 평가</span>
                                <p>{result.scoreReason}</p>
                                <p>{result.reason}</p>
                            </div>
                        </div>
                        <div className="casual-modal-actions">
                            <button type="button" className="casual-btn-cancel" onClick={handleRetry}>
                                다시 채점
                            </button>
                            <button type="button" className="casual-btn-cancel" onClick={handleOpenMyPage}>
                                갤러리에서 보기
                            </button>
                            <button type="button" className="casual-btn-submit" onClick={onClose}>
                                닫기
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
