import { getLevelColor } from '../../shared/utils/levelColor';
import type {
    GalleryDetailItem,
    GalleryListItem,
    NeighborPostsResult,
} from '../../shared/api/gallery';

interface GalleryFilmstripProps {
    currentPost: GalleryDetailItem;
    neighbors: NeighborPostsResult | null;
    onSelect: (item: GalleryListItem) => void;
}

export default function GalleryFilmstrip({
    currentPost,
    neighbors,
    onSelect,
}: GalleryFilmstripProps) {
    if (!neighbors) {
        return (
            <div className="gallery-filmstrip" aria-label="주변 게시글 불러오는 중">
                <div className="filmstrip-track">
                    {[0, 1, 2, 3, 4].map((index) => (
                        <div key={index} className="filmstrip-card-skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    const newerReversed = neighbors.newer.slice().reverse();

    return (
        <div className="gallery-filmstrip" aria-label="주변 게시글">
            {neighbors.newer.length === 0 && (
                <div className="filmstrip-edge-label">여기가 최신입니다</div>
            )}

            <div className="filmstrip-track">
                {newerReversed.map((item, index) => (
                    <FilmstripCard
                        key={item.id}
                        item={item}
                        distance={newerReversed.length - index}
                        onClick={() => onSelect(item)}
                    />
                ))}

                <FilmstripCard item={currentPost} isCurrent distance={0} />

                {neighbors.older.map((item, index) => (
                    <FilmstripCard
                        key={item.id}
                        item={item}
                        distance={index + 1}
                        onClick={() => onSelect(item)}
                    />
                ))}
            </div>

            {neighbors.older.length === 0 && (
                <div className="filmstrip-edge-label">여기가 마지막입니다</div>
            )}
        </div>
    );
}

function FilmstripCard({
    item,
    isCurrent = false,
    distance = 0,
    onClick,
}: {
    item: GalleryListItem | GalleryDetailItem;
    isCurrent?: boolean;
    distance?: number;
    onClick?: () => void;
}) {
    const opacity = isCurrent ? 1 : distance === 1 ? 0.92 : 0.7;
    const scale = isCurrent ? 1.08 : distance === 1 ? 0.92 : 0.76;

    return (
        <button
            type="button"
            className={`filmstrip-card ${isCurrent ? 'is-current' : ''}`}
            onClick={onClick}
            disabled={isCurrent}
            style={{
                opacity,
                borderColor: getLevelColor(item.authorLevel),
                ['--card-scale' as string]: scale.toString(),
            }}
            aria-label={isCurrent ? '현재 보고 있는 글' : `${item.title || '주변 글'}로 이동`}
        >
            <img src={item.src} alt={item.title || ''} loading="lazy" />
            {isCurrent && <div className="filmstrip-current-badge">현재</div>}
        </button>
    );
}
