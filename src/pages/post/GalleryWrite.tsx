import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../home/Home.css';
import './GalleryWrite.css';
import {
    createGalleryPost,
    getTagList,
    recommendTagsByImage,
    type TagItem,
} from '../../shared/api/gallery';
import { getValidToken } from '../../shared/utils/auth';

// 🔥 태그 검색에서 쓰이므로 남겨둡니다.
function SearchIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#6F6F6F" strokeWidth="2" />
            <path d="M20 20L16.65 16.65" stroke="#6F6F6F" strokeWidth="2" strokeLinecap="round" />
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

function UploadIcon() {
    return (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 16V5" stroke="#444" strokeWidth="1.8" strokeLinecap="round" />
            <path
                d="M8.5 8.5L12 5L15.5 8.5"
                stroke="#444"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="10" stroke="#444" strokeWidth="1.5" />
        </svg>
    );
}

const applyFilterToFile = (file: File, filter: string): Promise<File> => {
    return new Promise((resolve) => {
        // normal이면 원본 그대로 반환
        if (filter === 'normal') {
            resolve(file);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            if (!ctx) {
                resolve(file);
                return;
            }

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Canvas에 CSS filter 적용
            ctx.filter = filter;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const filteredFile = new File(
                        [blob],
                        file.name,
                        { type: file.type, lastModified: Date.now() }
                    );
                    resolve(filteredFile);
                },
                file.type,
                0.95 // 품질 95%
            );
        };

        img.onerror = () => resolve(file); // 에러 시 원본 반환
        img.src = URL.createObjectURL(file);
    });
};

export default function GalleryWrite() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // 🔥 상단 검색용 상태(searchText) 삭제 완료!

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [allTags, setAllTags] = useState<TagItem[]>([]);
    const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
    const [recommendedTags, setRecommendedTags] = useState<TagItem[]>([]);
    const [tagSearch, setTagSearch] = useState('');
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isRecommending, setIsRecommending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReady, setIsReady] = useState(false);

    //이미지 필터 기능 관련
    const [selectedFilter, setSelectedFilter] = useState<string>('normal');
    const [isTagRecommended, setIsTagRecommended] = useState<boolean>(false);

    useEffect(() => {
        const isLoggedIn = !!getValidToken();

        if (!isLoggedIn) {
            alert('갤러리 글쓰기는 로그인한 회원만 이용할 수 있습니다.');
            navigate('/login');
            return;
        }

        setIsReady(true);
    }, [navigate]);

    useEffect(() => {
        if (!isReady) return;

        const fetchTags = async () => {
            try {
                setIsLoadingTags(true);
                const tags = await getTagList();
                setAllTags(tags);
            } catch (error) {
                console.error('태그 목록 조회 실패:', error);
            } finally {
                setIsLoadingTags(false);
            }
        };

        void fetchTags();
    }, [isReady]);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl('');
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile]);

    const filteredTags = useMemo(() => {
        const keyword = tagSearch.trim().toLowerCase();

        return allTags.filter((tag) => {
            if (!keyword) return true;
            return tag.name.toLowerCase().includes(keyword);
        });
    }, [allTags, tagSearch]);

    const isTagSelected = (tagId: number) => {
        return selectedTags.some((tag) => tag.id === tagId);
    };

    const handleOpenFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleSelectFile = (file?: File | null) => {
        if (!file) return;
        setSelectedFile(file);
        setRecommendedTags([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        handleSelectFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0] ?? null;
        handleSelectFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const toggleTag = (tag: TagItem) => {
        if (isTagSelected(tag.id)) {
            setSelectedTags((prev) => prev.filter((item) => item.id !== tag.id));
            return;
        }

        setSelectedTags((prev) => [...prev, tag]);
    };

    const removeTag = (tagId: number) => {
        setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId));
    };

    const handleRecommendTags = async () => {
        if (!selectedFile) {
            alert('먼저 사진 파일을 선택해 주세요.');
            return;
        }

        try {
            setIsRecommending(true);
            const tags = await recommendTagsByImage(selectedFile);
            setRecommendedTags(tags);

            setSelectedTags((prev) => {
                const prevIds = new Set(prev.map((tag) => tag.id));
                const merged = [...prev];

                tags.forEach((tag) => {
                    if (!prevIds.has(tag.id)) {
                        merged.push(tag);
                    }
                });

                return merged;
            });
        } catch (error) {
            console.error('AI 태그 추천 실패:', error);
            alert('태그 추천 중 오류가 발생했습니다.');
        } finally {
            setIsRecommending(false);
            //이미지 필터 관련
            setIsTagRecommended(true);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert('사진을 업로드해 주세요.');
            return;
        }

        if (!title.trim()) {
            alert('제목을 입력해 주세요.');
            return;
        }

        if (!description.trim()) {
            alert('설명을 입력해 주세요.');
            return;
        }

        try {
            setIsSubmitting(true);

            // 필터가 normal이면 원본 파일 그대로 사용
            // 필터가 있으면 Canvas API로 필터 적용된 이미지 파일 생성
            const fileToSubmit = await applyFilterToFile(selectedFile, selectedFilter);

            await createGalleryPost({
                title: title.trim(),
                description: description.trim(),
                imageFiles: [fileToSubmit],
                tagIds: selectedTags.map((tag) => tag.id),
            });

            alert('갤러리 글이 등록되었습니다.');
            navigate('/gallery');
        } catch (error) {
            console.error('갤러리 글 등록 실패:', error);
            alert('등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isReady) return null;

    return (
        <div className="gallery-write-page">
            {/* 🔥 상단 검색바 영역(gallery-write-topbar) 완전 삭제 완료! */}

            <div className="gallery-write-shell" style={{ marginTop: '20px' }}>
                <div className="gallery-write-back">
                    <Link to="/gallery" className="gallery-write-back-link">
                        <BackIcon />
                    </Link>
                </div>

                <div className="gallery-write-card">
                    <div className="gallery-write-card-header">갤러리 글쓰기</div>

                    <div className="gallery-write-card-body">
                        <section className="gallery-write-left">
                            <div
                                className={`gallery-upload-box ${previewUrl ? 'has-preview' : ''}`}
                                onClick={handleOpenFilePicker}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    hidden
                                />

                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        className="gallery-upload-preview"
                                    />
                                ) : (
                                    <div className="gallery-upload-placeholder">
                                        <UploadIcon />
                                        <p>파일을 선택하거나</p>
                                        <p>여기로 끌어다 놓으세요</p>
                                    </div>
                                )}
                            </div>

                            <div className="gallery-left-divider" />

                            {/* 🎨 필터 UI 추가 */}
                            {previewUrl && (
                                <div className={`gallery-filter-section ${!isTagRecommended ? 'disabled' : ''}`}>
                                    <p className="gallery-filter-title">
                                        🎨 필터
                                        {!isTagRecommended && (
                                            <span className="gallery-filter-notice"> · 태그 추천 후 사용 가능합니다</span>
                                        )}
                                    </p>
                                    <div className="gallery-filter-list">
                                        {[
                                            { key: 'normal',                                            label: 'Normal' },
                                            { key: 'grayscale(100%)',                                   label: 'Grayscale' },
                                            { key: 'sepia(100%)',                                       label: 'Sepia' },
                                            { key: 'brightness(1.3)',                                   label: 'Bright' },
                                            { key: 'contrast(1.4)',                                     label: 'Contrast' },
                                            { key: 'sepia(50%) contrast(1.2) brightness(0.9)',          label: 'Vintage' },
                                            { key: 'hue-rotate(180deg) saturate(1.2)',                  label: 'Cool' },
                                            { key: 'sepia(30%) saturate(1.4) brightness(1.1)',          label: 'Warm' },
                                        ].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`gallery-filter-item ${selectedFilter === key ? 'active' : ''}`}
                                                onClick={() => isTagRecommended && setSelectedFilter(key)}
                                                disabled={!isTagRecommended}
                                            >
                                                <div className="gallery-filter-thumb-wrapper">
                                                    <img
                                                        src={previewUrl}
                                                        alt={label}
                                                        className="gallery-filter-thumb"
                                                        style={{ filter: key === 'normal' ? 'none' : key }}
                                                    />
                                                </div>
                                                <span className="gallery-filter-label">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </section>

                        <aside className="gallery-write-right">
                            <div className="gallery-inline-group">
                                <div className="gallery-inline-label">제목</div>
                                <input
                                    type="text"
                                    className="gallery-block-input"
                                    placeholder="제목추가"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="gallery-inline-group">
                                <div className="gallery-inline-label">설명</div>
                                <textarea
                                    className="gallery-block-textarea"
                                    placeholder="자세한 설명을 추가하세요"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="gallery-tag-search-row">
                                <span className="gallery-tag-search-inline-icon">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    className="gallery-tag-inline-input"
                                    placeholder="태그 목록 검색"
                                    value={tagSearch}
                                    onChange={(e) => setTagSearch(e.target.value)}
                                />
                            </div>

                            <div className="gallery-tag-panel">
                                <div className="gallery-tag-panel-title">
                                    태그된 주제({selectedTags.length})개
                                </div>

                                <div className="gallery-selected-tags">
                                    {selectedTags.length === 0 ? (
                                        <div className="gallery-empty-text">
                                            선택된 태그가 없습니다.
                                        </div>
                                    ) : (
                                        selectedTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className="gallery-tag-chip selected bordered"
                                                onClick={() => removeTag(tag.id)}
                                            >
                                                {tag.name} ×
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="gallery-tag-panel-subtitle">태그 검색</div>

                                <div className="gallery-tag-list">
                                    {isLoadingTags ? (
                                        <div className="gallery-empty-text">
                                            태그를 불러오는 중입니다.
                                        </div>
                                    ) : filteredTags.length === 0 ? (
                                        <div className="gallery-empty-text">
                                            일치하는 태그가 없습니다.
                                        </div>
                                    ) : (
                                        filteredTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className={`gallery-tag-chip bordered ${
                                                    isTagSelected(tag.id) ? 'selected' : ''
                                                }`}
                                                onClick={() => toggleTag(tag)}
                                            >
                                                {tag.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="gallery-recommend-row">
                                <button
                                    type="button"
                                    className="gallery-recommend-btn"
                                    onClick={handleRecommendTags}
                                    disabled={isRecommending}
                                >
                                    {isRecommending ? '추천 중...' : '태그 추천'}
                                </button>
                            </div>

                            {recommendedTags.length > 0 && (
                                <div className="gallery-recommend-tags">
                                    {recommendedTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`gallery-tag-chip bordered ${
                                                isTagSelected(tag.id) ? 'selected' : ''
                                            }`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                className="gallery-submit-btn"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '등록 중...' : '게시 !'}
                            </button>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
