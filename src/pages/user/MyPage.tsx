import { useState, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyPage.css';
import {
    getMyGalleryPosts,
    getMyGalleryCommentsLocal,
} from '../../shared/api/gallery';

// --- 타입 정의 ---
interface UserDataType {
    userId?: string;
    email?: string;
    name?: string;
    nickname?: string;
    bio?: string;
}

type MyBoardType = 'community' | 'forum' | 'gallery';

interface MyPostType {
    id: number | string;
    author: string;
    title: string;
    date: string;
    type: MyBoardType;
}

interface MyCommentType {
    id: number | string;
    postId: number | string;
    postTitle?: string;
    author: string;
    text: string;
    date: string;
    type: MyBoardType;
}

type RawMyActivity = Record<string, unknown>;

function getStringValue(value: unknown, fallback = '') {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function getIdValue(value: unknown, fallback: number | string = '') {
    if (typeof value === 'number' || typeof value === 'string') return value;
    return fallback;
}

function formatDate(value?: unknown) {
    if (!value || typeof value !== 'string') return '방금 전';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString();
}

function getBoardType(raw: RawMyActivity): MyBoardType {
    const boardValue = String(
        raw.boardType ?? raw.board ?? raw.type ?? raw.category ?? ''
    ).toUpperCase();

    if (boardValue === 'GALLERY') return 'gallery';
    if (boardValue === 'FORUM') return 'forum';
    return 'community';
}

function getBoardLabel(type: MyBoardType) {
    if (type === 'gallery') return '갤러리';
    if (type === 'forum') return '포럼';
    return '커뮤니티';
}

function getBoardColor(type: MyBoardType) {
    if (type === 'gallery') return '#7BC9A5';
    if (type === 'forum') return '#7B8AC9';
    return '#00bfa5';
}

function getDetailPath(type: MyBoardType, id: number | string) {
    if (type === 'gallery') return `/gallery?postId=${id}`;
    return `/${type}/${id}`;
}

function uniqueByTypeAndId<T extends { id: number | string; type: MyBoardType }>(
    items: T[]
): T[] {
    return Array.from(
        new Map(items.map((item) => [`${item.type}-${item.id}`, item])).values()
    );
}

export default function MyPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<string>('posts');
    const [infoTab, setInfoTab] = useState<string>('account');
    const [isPwModalOpen, setIsPwModalOpen] = useState<boolean>(false);

    const [userData, setUserData] = useState<UserDataType>({});
    const [userName, setUserName] = useState<string>('숲속으로');
    const [bio, setBio] = useState<string>('한줄소개쓰는 공간');
    const [isEditingBio, setIsEditingBio] = useState<boolean>(false);

    const [editNickname, setEditNickname] = useState<string>('');
    const [isNicknameChecked, setIsNicknameChecked] = useState<boolean>(true);

    const [myPosts, setMyPosts] = useState<MyPostType[]>([]);
    const [myComments, setMyComments] = useState<MyCommentType[]>([]);

    // 1. 백엔드에서 내 정보 가져오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            try {
                const response = await axios.get('/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = response.data.data || response.data;

                const fetchedUser: UserDataType = {
                    userId: data.loginId || data.userId || data.username || '',
                    email: data.email || '',
                    name: data.name || '',
                    nickname: data.nickname || data.name || '숲속으로',
                    bio: data.bio || '한줄소개쓰는 공간',
                };

                setUserData(fetchedUser);
                setUserName(fetchedUser.nickname!);
                setEditNickname(fetchedUser.nickname!);
                setBio(fetchedUser.bio!);
            } catch (error) {
                console.error('내 정보 불러오기 실패:', error);
            }
        };

        void fetchMyInfo();
    }, []);

    // 2. 백엔드에서 '내가 쓴 글' & '내가 쓴 댓글' 가져오기 + 갤러리 데이터 합치기
    useEffect(() => {
        if (userName === '숲속으로') return;

        const fetchMyActivities = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            // --- 내가 쓴 글 가져오기 ---
            try {
                const postsRes = await axios.get('/api/users/me/myposts', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const postsData: RawMyActivity[] =
                    postsRes.data.data || postsRes.data?.content || [];

                const formattedPosts: MyPostType[] = postsData.map((p) => ({
                    id: getIdValue(p.id ?? p.postId),
                    author: getStringValue(
                        p.author ?? p.nickname,
                        userName
                    ),
                    title: getStringValue(p.title, '제목 없음'),
                    date: formatDate(p.createdAt ?? p.createdDate),
                    type: getBoardType(p),
                }));

                const myGalleryPosts = await getMyGalleryPosts().catch(() => []);

                const galleryPosts: MyPostType[] = myGalleryPosts.map((post) => ({
                    id: post.id,
                    author: post.author,
                    title: post.title || '제목 없음',
                    date: formatDate(post.createdAt),
                    type: 'gallery',
                }));

                setMyPosts(uniqueByTypeAndId([...formattedPosts, ...galleryPosts]));
            } catch (error) {
                console.error('내가 쓴 글 불러오기 실패:', error);

                const myGalleryPosts = await getMyGalleryPosts().catch(() => []);

                setMyPosts(
                    myGalleryPosts.map((post) => ({
                        id: post.id,
                        author: post.author,
                        title: post.title || '제목 없음',
                        date: formatDate(post.createdAt),
                        type: 'gallery',
                    }))
                );
            }

            // --- 내가 쓴 댓글 가져오기 ---
            try {
                const commentsRes = await axios.get('/api/users/me/mycomments', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const commentsData: RawMyActivity[] =
                    commentsRes.data.data || commentsRes.data?.content || [];

                const formattedComments: MyCommentType[] = commentsData.map((c) => ({
                    id: getIdValue(c.commentId ?? c.id),
                    postId: getIdValue(
                        c.postId ??
                        c.post_id ??
                        c.boardId ??
                        c.board_id ??
                        c.articleId
                    ),
                    postTitle: getStringValue(c.postTitle ?? c.title),
                    author: getStringValue(c.nickname ?? c.author, userName),
                    text: getStringValue(c.content ?? c.text),
                    date: formatDate(c.createdAt ?? c.createdDate),
                    type: getBoardType(c),
                }));

                const localGalleryComments: MyCommentType[] =
                    getMyGalleryCommentsLocal().map((comment) => ({
                        id: comment.id,
                        postId: comment.postId,
                        postTitle: comment.postTitle,
                        author: userName,
                        text: comment.content,
                        date: formatDate(comment.createdAt),
                        type: 'gallery',
                    }));

                setMyComments(
                    uniqueByTypeAndId([...formattedComments, ...localGalleryComments])
                );
            } catch (error) {
                console.error('내가 쓴 댓글 불러오기 실패:', error);

                const localGalleryComments: MyCommentType[] =
                    getMyGalleryCommentsLocal().map((comment) => ({
                        id: comment.id,
                        postId: comment.postId,
                        postTitle: comment.postTitle,
                        author: userName,
                        text: comment.content,
                        date: formatDate(comment.createdAt),
                        type: 'gallery',
                    }));

                setMyComments(localGalleryComments);
            }
        };

        void fetchMyActivities();
    }, [userName]);

    // 3. 한줄소개 저장
    const handleSaveBio = async () => {
        try {
            const token = localStorage.getItem('access_token');

            await axios.put(
                '/api/users/me',
                { bio },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const savedUser: UserDataType = { ...userData, bio };
            setUserData(savedUser);
            setIsEditingBio(false);
            alert('한줄소개가 저장되었습니다!');
        } catch (error) {
            console.error('한줄소개 수정 실패:', error);
            alert('저장에 실패했습니다.');
        }
    };

    // 닉네임 중복 확인
    const handleNicknameCheck = async () => {
        if (!editNickname.trim()) {
            alert('변경할 닉네임을 입력해주세요.');
            return;
        }

        if (editNickname === userData.nickname) {
            alert('현재 사용 중인 닉네임입니다.');
            return;
        }

        alert('사용 가능한 닉네임입니다!');
        setIsNicknameChecked(true);
    };

    // 4. 계정 정보(닉네임) 저장
    const handleSaveAccount = async () => {
        if (editNickname !== userData.nickname && !isNicknameChecked) {
            alert('닉네임 중복확인을 먼저 진행해주세요.');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            await axios.put(
                '/api/users/me',
                { nickname: editNickname },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser: UserDataType = {
                ...userData,
                nickname: editNickname,
            };

            setUserData(updatedUser);
            setUserName(editNickname);

            alert('계정 정보가 성공적으로 변경되었습니다!');
        } catch (error) {
            console.error('정보 수정 실패:', error);
            alert('변경사항 저장에 실패했습니다.');
        }
    };

    const renderInfoContent = () => {
        if (infoTab === 'account') {
            return (
                <div className="info-content">
                    <h2>계정</h2>
                    <p className="info-desc">계정의 기본정보들을 설정할 수 있습니다.</p>

                    <div className="info-input-group">
                        <label>아이디 (필수)</label>
                        <input
                            type="text"
                            value={userData.userId || ''}
                            readOnly
                            style={{ backgroundColor: '#f8f9fa' }}
                        />
                    </div>

                    <div className="info-input-group">
                        <label>대표 이메일 (필수)</label>
                        <input
                            type="text"
                            value={userData.email || ''}
                            readOnly
                            style={{ backgroundColor: '#f8f9fa' }}
                        />
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                            대표 이메일 주소를 설정해 주세요. 모든 안내는 이 이메일로 발송됩니다.
                        </div>
                    </div>

                    <div className="info-input-group">
                        <label>이름</label>
                        <input
                            type="text"
                            value={userData.name || ''}
                            readOnly
                            style={{ backgroundColor: '#f8f9fa' }}
                        />
                    </div>

                    <div className="info-input-group">
                        <label>닉네임</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={editNickname}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setEditNickname(e.target.value);
                                    setIsNicknameChecked(false);
                                }}
                                placeholder="닉네임 입력"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                }}
                            />
                            <button
                                onClick={handleNicknameCheck}
                                style={{
                                    padding: '0 15px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: '#555',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                중복확인
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveAccount}
                        style={{
                            marginTop: '10px',
                            padding: '12px 24px',
                            backgroundColor: '#00bfa5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                        }}
                    >
                        변경사항 저장
                    </button>

                    <div
                        style={{
                            marginTop: '40px',
                            paddingTop: '20px',
                            borderTop: '1px solid #eee',
                        }}
                    >
                        <button className="delete-account-btn">🗑 계정 삭제하기</button>
                    </div>
                </div>
            );
        }

        if (infoTab === 'social') {
            return (
                <div className="info-content">
                    <h2>간편 로그인</h2>
                    <p className="info-desc">간편 로그인 관리</p>

                    <div className="social-connect-item">
                        <div className="social-info">
                            <div
                                className="social-icon"
                                style={{ backgroundColor: '#fee500', color: '#000' }}
                            >
                                K
                            </div>
                            <span>연동되지 않음</span>
                        </div>
                        <button className="connect-btn inactive">연동하기</button>
                    </div>

                    <div className="social-connect-item">
                        <div className="social-info">
                            <div
                                className="social-info-icon"
                                style={{
                                    backgroundColor: '#ea4335',
                                    color: '#fff',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    marginRight: '10px',
                                }}
                            >
                                G
                            </div>
                            <span>연동되지 않음</span>
                        </div>
                        <button className="connect-btn active">연동하기</button>
                    </div>

                    <div className="social-connect-item">
                        <div className="social-info">
                            <div
                                className="social-info-icon"
                                style={{
                                    backgroundColor: '#03c75a',
                                    color: '#fff',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    marginRight: '10px',
                                }}
                            >
                                N
                            </div>
                            <span>연동되지 않음</span>
                        </div>
                        <button className="connect-btn active">연동하기</button>
                    </div>

                    <div className="social-connect-item">
                        <div className="social-info">
                            <div
                                className="social-info-icon"
                                style={{
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    marginRight: '10px',
                                }}
                            >
                                
                            </div>
                            <span>연동되지 않음</span>
                        </div>
                        <button className="connect-btn active">연동하기</button>
                    </div>
                </div>
            );
        }

        if (infoTab === 'password') {
            return (
                <div className="info-content">
                    <h2>비밀번호</h2>
                    <p className="info-desc">비밀번호 관리</p>
                    <div className="pw-change-box" onClick={() => setIsPwModalOpen(true)}>
                        <span>🔒 비밀번호 변경하기</span>
                        <span>→</span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="mypage-container">
            <div className="profile-section">
                <div className="profile-image-wrapper">
                    <img
                        src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=400&auto=format&fit=crop"
                        alt="프로필"
                        className="profile-image"
                    />
                </div>

                <div className="profile-info">
                    <h1 className="profile-nickname">{userName}</h1>

                    {isEditingBio ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input
                                type="text"
                                value={bio}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setBio(e.target.value)
                                }
                                style={{
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    width: '200px',
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleSaveBio}
                                style={{
                                    padding: '6px 12px',
                                    background: '#00bfa5',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                저장
                            </button>
                            <button
                                onClick={() => setIsEditingBio(false)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#eee',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '5px',
                            }}
                        >
                            <p className="profile-status" style={{ margin: 0, color: '#666' }}>
                                {bio}
                            </p>
                            <button
                                onClick={() => setIsEditingBio(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    textDecoration: 'underline',
                                }}
                            >
                                수정
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mypage-divider"></div>

            <div className="mypage-tabs">
                <button
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    내가 쓴 글
                </button>
                <button
                    className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    내가 쓴 댓글
                </button>
                <button
                    className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quizzes')}
                >
                    내가 푼 문제
                </button>
                <button
                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    나의 정보
                </button>
            </div>

            <div className="tab-content" style={{ padding: '40px 0' }}>
                {activeTab === 'posts' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>
                            작성한 게시글 총 {myPosts.length}개
                        </h3>

                        {myPosts.length === 0 ? (
                            <p
                                style={{
                                    color: '#999',
                                    textAlign: 'center',
                                    padding: '40px 0',
                                }}
                            >
                                작성한 게시글이 없습니다.
                            </p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {myPosts.map((post) => (
                                    <li
                                        key={`${post.type}-${post.id}`}
                                        onClick={() => navigate(getDetailPath(post.type, post.id))}
                                        style={{
                                            borderBottom: '1px solid #eee',
                                            padding: '15px 0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: getBoardColor(post.type),
                                                    marginRight: '10px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {getBoardLabel(post.type)}
                                            </span>
                                            <span style={{ fontSize: '16px', color: '#333' }}>
                                                {post.title}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#999' }}>
                                            {post.date}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>
                            작성한 댓글 총 {myComments.length}개
                        </h3>

                        {myComments.length === 0 ? (
                            <p
                                style={{
                                    color: '#999',
                                    textAlign: 'center',
                                    padding: '40px 0',
                                }}
                            >
                                작성한 댓글이 없습니다.
                            </p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {myComments.map((comment) => (
                                    <li
                                        key={`${comment.type}-${comment.id}`}
                                        onClick={() =>
                                            navigate(getDetailPath(comment.type, comment.postId))
                                        }
                                        style={{
                                            borderBottom: '1px solid #eee',
                                            padding: '15px 0',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '15px',
                                                color: '#333',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            {comment.text}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>
                                            <span
                                                style={{
                                                    color: getBoardColor(comment.type),
                                                    marginRight: '8px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {getBoardLabel(comment.type)}
                                            </span>

                                            {comment.postTitle && (
                                                <span style={{ marginRight: '8px' }}>
                                                    {comment.postTitle}
                                                </span>
                                            )}

                                            {comment.date}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div
                        style={{
                            color: '#999',
                            textAlign: 'center',
                            padding: '40px 0',
                        }}
                    >
                        준비 중인 기능입니다.
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="info-container">
                        <aside className="info-sidebar">
                            <h3>설정</h3>
                            <ul>
                                <li
                                    className={infoTab === 'account' ? 'active' : ''}
                                    onClick={() => setInfoTab('account')}
                                >
                                    👤 계정
                                </li>
                                <li
                                    className={infoTab === 'social' ? 'active' : ''}
                                    onClick={() => setInfoTab('social')}
                                >
                                    🚪 간편로그인
                                </li>
                                <li
                                    className={infoTab === 'password' ? 'active' : ''}
                                    onClick={() => setInfoTab('password')}
                                >
                                    🔒 비밀번호
                                </li>
                            </ul>
                        </aside>
                        {renderInfoContent()}
                    </div>
                )}
            </div>

            {isPwModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPwModalOpen(false)}>
                    <div
                        className="modal-content"
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        <h3>비밀번호 변경하기</h3>

                        <div className="info-input-group" style={{ marginBottom: '15px' }}>
                            <label>기존 비밀번호</label>
                            <input
                                type="password"
                                placeholder="필수 입력"
                                style={{ backgroundColor: '#fff' }}
                            />
                        </div>

                        <div className="info-input-group" style={{ marginBottom: '15px' }}>
                            <label>새 비밀번호 (필수)</label>
                            <input
                                type="password"
                                placeholder="필수 입력"
                                style={{ backgroundColor: '#fff' }}
                            />
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                                ✔ 최소 8자 이상 ✔ 숫자 1자 이상 포함 ✔ 대소문자 혼합
                            </div>
                        </div>

                        <div className="info-input-group">
                            <label>새 비밀번호 확인 (필수)</label>
                            <input
                                type="password"
                                placeholder="필수 입력"
                                style={{ backgroundColor: '#fff' }}
                            />
                        </div>

                        <button
                            className="modal-save-btn"
                            onClick={() => {
                                alert('비밀번호가 변경되었습니다!');
                                setIsPwModalOpen(false);
                            }}
                        >
                            비밀번호 저장하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}