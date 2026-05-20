import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../home/Home.css';
import './CommunityWrite.css';
import RichPostEditor from '../../widgets/editor/RichPostEditor';
import { apiClient } from '../../shared/api/client';
import { getValidToken } from '../../shared/utils/auth';

const brandTagIdMap: Record<string, number> = {
    Canon: 9,
    Sony: 10,
    Nikon: 11,
    Fujifilm: 12,
    Leica: 13,
    Hasselblad: 14,
    Panasonic: 15,
    Olympus: 16,
    '기타(etc)': 17,
    Film: 76,
};

export default function ForumWrite() {
    const navigate = useNavigate();

    const [camera, setCamera] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!camera) return alert('카메라 종류를 선택해주세요.');
        if (!title.trim()) return alert('제목을 입력해주세요.');
        if (!content.replace(/<[^>]*>/g, '').trim() && !/<img\s/i.test(content)) {
            return alert('내용을 입력해주세요.');
        }

        const token = getValidToken();
        if (!token) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
            return;
        }

        const tagId = brandTagIdMap[camera];

        try {
            await apiClient.post('/posts', {
                boardType: 'FORUM',
                title: title.trim(),
                content,
                tagIds: tagId ? [tagId] : [],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('포럼 게시글이 성공적으로 등록되었습니다.');
            navigate('/forum');
        } catch (error) {
            console.error('게시글 등록 실패:', error);
            alert('글 작성에 실패했습니다. 네트워크 상태와 로그인을 확인해주세요.');
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
                            value={camera}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setCamera(e.target.value)}
                        >
                            <option value="">카메라 종류를 선택해주세요</option>
                            <option value="Canon">Canon</option>
                            <option value="Sony">Sony</option>
                            <option value="Nikon">Nikon</option>
                            <option value="Fujifilm">Fujifilm</option>
                            <option value="Leica">Leica</option>
                            <option value="Hasselblad">Hasselblad</option>
                            <option value="Olympus">Olympus</option>
                            <option value="Panasonic">Panasonic</option>
                            <option value="Film">Film</option>
                            <option value="기타(etc)">기타(etc)</option>
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
