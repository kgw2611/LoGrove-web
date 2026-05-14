import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../home/Home.css';
import './CommunityWrite.css';
import RichPostEditor from '../../widgets/editor/RichPostEditor';

const communityTagIdMap: Record<string, number> = {
    '일상': 1,
    '거래': 2,
    '정보': 3,
    '질문': 4,
    '사진': 5,
    '출사지': 6,
    '이벤트': 7,
    '리뷰': 79,
};

export default function CommunityWrite() {
    const navigate = useNavigate();

    const [board, setBoard] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!board) return alert('게시판 카테고리를 선택해주세요.');
        if (!title.trim()) return alert('제목을 입력해주세요.');
        if (!content.replace(/<[^>]*>/g, '').trim() && !/<img\s/i.test(content)) {
            return alert('내용을 입력해주세요.');
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
            return;
        }

        const tagId = communityTagIdMap[board];

        try {
            await axios.post('/api/posts', {
                boardType: 'COMMUNITY',
                title: title.trim(),
                content,
                tagIds: tagId ? [tagId] : [],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('게시글이 성공적으로 등록되었습니다.');
            navigate('/community');
        } catch (error) {
            console.error('게시글 등록 실패:', error);
            alert('글 작성에 실패했습니다. 서버 상태와 로그인을 확인해주세요.');
        }
    };

    return (
        <div className="write-container">
            <div className="write-header-bar">
                <div className="write-header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <span className="write-header-title">LoGrove 글쓰기</span>
                </div>
                <div className="write-header-right">
                    <span className="temp-save">임시등록 <span className="temp-count">0</span></span>
                    <button className="submit-post-btn" onClick={handleSubmit}>등록</button>
                </div>
            </div>

            <div className="write-content" style={{ display: 'block' }}>
                <main className="write-main" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="editor-top">
                        <select
                            className="board-select"
                            value={board}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setBoard(e.target.value)}
                        >
                            <option value="">게시판을 선택해주세요</option>
                            <option value="일상">일상</option>
                            <option value="거래">거래</option>
                            <option value="정보">정보</option>
                            <option value="질문">질문</option>
                            <option value="사진">사진</option>
                            <option value="출사지">출사지</option>
                            <option value="이벤트">이벤트</option>
                            <option value="리뷰">리뷰</option>
                        </select>
                        <input
                            type="text"
                            className="title-input"
                            placeholder="제목을 입력해 주세요"
                            value={title}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        />
                    </div>

                    <RichPostEditor
                        onChange={setContent}
                        placeholder="텍스트를 입력하고 사진을 원하는 위치에 넣어보세요."
                    />
                </main>
            </div>
        </div>
    );
}
