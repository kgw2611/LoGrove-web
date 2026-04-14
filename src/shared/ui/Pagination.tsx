interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px' }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                style={btnStyle(false, currentPage === 0)}
            >
                &lt;
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    style={btnStyle(page === currentPage, false)}
                >
                    {page + 1}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                style={btnStyle(false, currentPage === totalPages - 1)}
            >
                &gt;
            </button>
        </div>
    );
}

function btnStyle(isActive: boolean, isDisabled: boolean): React.CSSProperties {
    return {
        minWidth: '34px',
        height: '34px',
        padding: '0 8px',
        border: '1px solid',
        borderColor: isActive ? '#b8d9c7' : '#ddd',
        borderRadius: '8px',
        background: isActive ? '#b8d9c7' : '#fff',
        color: isActive ? '#3f5447' : isDisabled ? '#ccc' : '#444',
        fontWeight: isActive ? 600 : 400,
        fontSize: '14px',
        cursor: isDisabled ? 'default' : 'pointer',
    };
}
