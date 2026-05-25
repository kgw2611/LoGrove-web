import { useEffect, useMemo, useState } from 'react';
import { ColumnsPhotoAlbum, type Photo } from 'react-photo-album';
import 'react-photo-album/columns.css';
import { getGalleryNeighbors, type GalleryListItem } from '../../shared/api/gallery';

interface GallerySideGridProps {
    currentPostId: number;
    onSelect: (item: GalleryListItem) => void;
}

type SidePhoto = Photo & { item: GalleryListItem };

// 앞뒤 6개씩 = 최대 12장, 2컬럼 6행
const NEIGHBOR_COUNT = 6;

const getSideGridColumns = (containerWidth: number | undefined) => {
    if (!containerWidth || containerWidth < 280) return 1;
    return 2;
};

const getSideGridSpacing = (containerWidth: number | undefined) => {
    return containerWidth && containerWidth < 280 ? 8 : 10;
};

export default function GallerySideGrid({ currentPostId, onSelect }: GallerySideGridProps) {
    const [items, setItems] = useState<GalleryListItem[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        setItems(null);

        getGalleryNeighbors(currentPostId, NEIGHBOR_COUNT)
            .then((res) => {
                if (cancelled) return;
                // newer는 최신순이므로 역순으로 (오래된 것 먼저) → 현재 글 → older 순 배열
                const ordered = [...res.newer.slice().reverse(), ...res.older];
                setItems(ordered);
            })
            .catch((error) => {
                console.error('사이드 그리드 로드 실패:', error);
                if (!cancelled) setItems([]);
            });

        return () => {
            cancelled = true;
        };
    }, [currentPostId]);

    const photos = useMemo<SidePhoto[]>(
        () => (items ?? []).map((item) => ({
            src: item.src,
            width: item.width || 4,
            height: item.height || 5,
            alt: item.title || 'gallery photo',
            item,
        })),
        [items]
    );


    if (items === null) {
        return (
            <div className="gallery-side-grid">
                <div className="gallery-side-grid-skeleton">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="gallery-side-grid-skel-cell" />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="gallery-side-grid">
                <div className="gallery-side-grid-empty">다른 게시글이 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="gallery-side-grid">
            <ColumnsPhotoAlbum
                photos={photos}
                columns={getSideGridColumns}
                spacing={getSideGridSpacing}
                onClick={({ photo }) => onSelect(photo.item)}
                render={{
                    photo: ({ onClick }, { photo, width, height }) => (
                        <button
                            type="button"
                            className="gallery-side-grid-card"
                            style={{ width, height }}
                            onClick={onClick}
                            aria-label={`${photo.item.title || '갤러리 게시글'}로 이동`}
                        >
                            <img src={photo.src} alt={photo.alt ?? ''} loading="lazy" />
                        </button>
                    ),
                }}
            />
        </div>
    );
}
