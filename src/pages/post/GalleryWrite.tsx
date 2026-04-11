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

function SearchIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#6F6F6F" strokeWidth="2" />
            <path d="M20 20L16.65 16.65" stroke="#6F6F6F" strokeWidth="2" strokeLinecap="round" />
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

export default function GalleryWrite() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [searchText, setSearchText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [allTags, setAllTags] = useState<TagItem[]>([]);
    const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
    const [recommendedTags, setRecommendedTags] = useState<TagItem[]>([]);
    const [tagSearch, setTagSearch] = useState('');
    const [allowComments, setAllowComments] = useState(true);
    const [allowShare, setAllowShare] = useState(true);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isRecommending, setIsRecommending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const isLoggedIn = !!localStorage.getItem('access_token');

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

        fetchTags();
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

            await createGalleryPost({
                title: title.trim(),
                description: description.trim(),
                imageFiles: [selectedFile],
                tagIds: selectedTags.map((tag) => tag.id),
            });

            // allowComments / allowShare는 백엔드 필드 확정되면 같이 보내면 됨
            console.log('댓글 허용:', allowComments, '공유 허용:', allowShare);

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
            <div className="gallery-write-topbar">
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

                <div className="gallery-write-top-actions">
                    <button className="gallery-profile-btn" type="button" aria-label="profile">
                        <UserIcon />
                    </button>
                    <button className="gallery-dropdown-btn" type="button" aria-label="more">
                        <ChevronDownIcon />
                    </button>
                </div>
            </div>

            <div className="gallery-write-shell">
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
                                    <img src={previewUrl} alt="preview" className="gallery-upload-preview" />
                                ) : (
                                    <div className="gallery-upload-placeholder">
                                        <UploadIcon />
                                        <p>파일을 선택하거나</p>
                                        <p>여기로 끌어다 놓으세요</p>
                                    </div>
                                )}
                            </div>

                            <div className="gallery-left-divider" />
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
                                <div className="gallery-tag-panel-title">태그된 주제({selectedTags.length})개</div>

                                <div className="gallery-selected-tags">
                                    {selectedTags.length === 0 ? (
                                        <div className="gallery-empty-text">선택된 태그가 없습니다.</div>
                                    ) : (
                                        selectedTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className="gallery-tag-chip selected"
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
                                        <div className="gallery-empty-text">태그를 불러오는 중입니다.</div>
                                    ) : filteredTags.length === 0 ? (
                                        <div className="gallery-empty-text">일치하는 태그가 없습니다.</div>
                                    ) : (
                                        filteredTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className={`gallery-tag-chip ${isTagSelected(tag.id) ? 'selected' : ''}`}
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
                                            className={`gallery-tag-chip ${isTagSelected(tag.id) ? 'selected' : ''}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="gallery-option-list">
                                <div className="gallery-option-row">
                                    <span>댓글달기 허용</span>
                                    <button
                                        type="button"
                                        className={`gallery-toggle ${allowComments ? 'on' : ''}`}
                                        onClick={() => setAllowComments((prev) => !prev)}
                                    >
                                        <span className="gallery-toggle-thumb" />
                                    </button>
                                </div>

                                <div className="gallery-option-row">
                                    <span>공유 허용</span>
                                    <button
                                        type="button"
                                        className={`gallery-toggle ${allowShare ? 'on' : ''}`}
                                        onClick={() => setAllowShare((prev) => !prev)}
                                    >
                                        <span className="gallery-toggle-thumb" />
                                    </button>
                                </div>
                            </div>

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