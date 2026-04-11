import { useState, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

// --- 타입 정의 ---
interface UserDataType {
    userId?: string;
    email?: string;
    name?: string;
    nickname?: string;
    bio?: string;
}

interface MyPostType {
    id: number | string;
    author: string;
    title: string;
    date: string;
    type: 'community' | 'forum';
}

interface MyCommentType {
    id: number | string;
    postId: number | string;
    author: string;
    text: string;
    date: string;
    type: 'community' | 'forum';
}

export default function MyPage() {
    const navigate = useNavigate();

    // 메인 탭 상태 (기본값: posts)
    const [activeTab, setActiveTab] = useState<string>('posts');

    // 나의 정보 서브 탭 상태 (기본값: account)
    const [infoTab, setInfoTab] = useState<string>('account');

    // 비밀번호 변경 모달 창 열림/닫힘 상태
    const [isPwModalOpen, setIsPwModalOpen] = useState<boolean>(false);

    // 유저 데이터 상태 관리
    const [userData, setUserData] = useState<UserDataType>({});
    const [userName, setUserName] = useState<string>('숲속으로'); // 상단에 보여질 닉네임(또는 이름)
    const [bio, setBio] = useState<string>('한줄소개쓰는 공간');
    const [isEditingBio, setIsEditingBio] = useState<boolean>(false);

    // 닉네임 변경 관련 상태
    const [editNickname, setEditNickname] = useState<string>('');
    const [isNicknameChecked, setIsNicknameChecked] = useState<boolean>(true); // 처음엔 기존 닉네임이니 true

    const [myPosts, setMyPosts] = useState<MyPostType[]>([]);
    const [myComments, setMyComments] = useState<MyCommentType[]>([]);

    useEffect(() => {
        // 1. 유저 정보 전체 불러오기
        const savedUserString = localStorage.getItem('user_db');
        let currentDisplayName = '숲속으로';

        if (savedUserString) {
            const savedUser: UserDataType = JSON.parse(savedUserString);
            setUserData(savedUser);

            // 닉네임이 있으면 닉네임을, 없으면 이름을 보여줍니다.
            currentDisplayName = savedUser.nickname || savedUser.name || '숲속으로';
            setUserName(currentDisplayName);
            setEditNickname(savedUser.nickname || ''); // 닉네임 입력창 초기값 세팅

            if (savedUser.bio) setBio(savedUser.bio);
        }

        // 2. 내가 쓴 글 불러오기
        const commPosts: MyPostType[] = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const forumPosts: MyPostType[] = JSON.parse(localStorage.getItem('forum_posts') || '[]');

        const allMyPosts: MyPostType[] = [
            ...commPosts.filter(p => p.author === currentDisplayName).map(p => ({ ...p, type: 'community' as const })),
            ...forumPosts.filter(p => p.author === currentDisplayName).map(p => ({ ...p, type: 'forum' as const }))
        ].sort((a, b) => Number(b.id) - Number(a.id));

        setMyPosts(allMyPosts);

        // 3. 내가 쓴 댓글 불러오기
        const commComments: MyCommentType[] = JSON.parse(localStorage.getItem('community_comments') || '[]');
        const forumComments: MyCommentType[] = JSON.parse(localStorage.getItem('forum_comments') || '[]');

        // 🔥 핵심: 내가 쓴 댓글 중, '원본 게시글이 아직 존재하는 댓글'만 골라냅니다!
        const allMyComments: MyCommentType[] = [
            ...commComments
                .filter(c => c.author === currentDisplayName)
                // 커뮤니티 원본 글 존재 여부 확인 (게시글 목록에 이 댓글의 postId가 있는지 검사)
                .filter(c => commPosts.some(p => p.id.toString() === c.postId.toString()))
                .map(c => ({ ...c, type: 'community' as const })),
            ...forumComments
                .filter(c => c.author === currentDisplayName)
                // 포럼 원본 글 존재 여부 확인 (게시글 목록에 이 댓글의 postId가 있는지 검사)
                .filter(c => forumPosts.some(p => p.id.toString() === c.postId.toString()))
                .map(c => ({ ...c, type: 'forum' as const }))
        ].sort((a, b) => Number(b.id) - Number(a.id));

        setMyComments(allMyComments);
    }, [userName]); // userName이 바뀔 때마다 글/댓글 다시 불러오기

    // 한줄소개 저장
    const handleSaveBio = () => {
        const savedUser: UserDataType = { ...userData, bio: bio };
        localStorage.setItem('user_db', JSON.stringify(savedUser));
        setUserData(savedUser);
        setIsEditingBio(false);
        alert('한줄소개가 저장되었습니다!');
    };

    // 닉네임 중복 확인 함수
    const handleNicknameCheck = () => {
        if (!editNickname.trim()) {
            return alert('변경할 닉네임을 입력해주세요.');
        }
        if (editNickname === userData.nickname) {
            return alert('현재 사용 중인 닉네임입니다.');
        }
        // 실제로는 여기서 백엔드에 중복 확인을 요청합니다.
        alert('사용 가능한 닉네임입니다!');
        setIsNicknameChecked(true);
    };

    // 계정 정보(닉네임) 변경사항 저장 함수
    const handleSaveAccount = () => {
        if (editNickname !== userData.nickname && !isNicknameChecked) {
            return alert('닉네임 중복확인을 먼저 진행해주세요.');
        }

        const updatedUser: UserDataType = { ...userData, nickname: editNickname };
        localStorage.setItem('user_db', JSON.stringify(updatedUser));

        setUserData(updatedUser);
        setUserName(editNickname); // 프로필 이름 즉시 변경!

        alert('계정 정보가 성공적으로 변경되었습니다!');
    };

    // '나의 정보' 탭 안의 내용을 그려주는 함수
    const renderInfoContent = () => {
        if (infoTab === 'account') {
            return (
                <div className="info-content">
                    <h2>계정</h2>
                    <p className="info-desc">계정의 기본정보들을 설정할 수 있습니다.</p>

                    <div className="info-input-group">
                        <label>아이디 (필수)</label>
                        <input type="text" value={userData.userId || ''} readOnly style={{ backgroundColor: '#f8f9fa' }} />
                    </div>
                    <div className="info-input-group">
                        <label>대표 이메일 (필수)</label>
                        <input type="text" value={userData.email || ''} readOnly style={{ backgroundColor: '#f8f9fa' }} />
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                            대표 이메일 주소를 설정해 주세요. 모든 안내는 이 이메일로 발송됩니다.
                        </div>
                    </div>
                    <div className="info-input-group">
                        <label>이름</label>
                        <input type="text" value={userData.name || ''} readOnly style={{ backgroundColor: '#f8f9fa' }} />
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
                                style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #ddd' }}
                            />
                            <button
                                onClick={handleNicknameCheck}
                                style={{ padding: '0 15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#555', whiteSpace: 'nowrap' }}
                            >
                                중복확인
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveAccount}
                        style={{ marginTop: '10px', padding: '12px 24px', backgroundColor: '#00bfa5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        변경사항 저장
                    </button>

                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
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
                        <div className="social-info"><div className="social-icon" style={{backgroundColor: '#fee500', color: '#000'}}>K</div><span>연동되지 않음</span></div>
                        <button className="connect-btn inactive">연동하기</button>
                    </div>
                    <div className="social-connect-item">
                        <div className="social-info"><div className="social-info-icon" style={{backgroundColor: '#ea4335', color: '#fff', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginRight: '10px'}}>G</div><span>연동되지 않음</span></div>
                        <button className="connect-btn active">연동하기</button>
                    </div>
                    <div className="social-connect-item">
                        <div className="social-info"><div className="social-info-icon" style={{backgroundColor: '#03c75a', color: '#fff', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginRight: '10px'}}>N</div><span>연동되지 않음</span></div>
                        <button className="connect-btn active">연동하기</button>
                    </div>
                    <div className="social-connect-item">
                        <div className="social-info"><div className="social-info-icon" style={{backgroundColor: '#000', color: '#fff', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginRight: '10px'}}></div><span>연동되지 않음</span></div>
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
                    <img src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=400&auto=format&fit=crop" alt="프로필" className="profile-image" />
                </div>
                <div className="profile-info">
                    <h1 className="profile-nickname">{userName}</h1>
                    {isEditingBio ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input type="text" value={bio} onChange={(e: ChangeEvent<HTMLInputElement>) => setBio(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }} autoFocus />
                            <button onClick={handleSaveBio} style={{ padding: '6px 12px', background: '#00bfa5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>저장</button>
                            <button onClick={() => setIsEditingBio(false)} style={{ padding: '6px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>취소</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <p className="profile-status" style={{ margin: 0, color: '#666' }}>{bio}</p>
                            <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>수정</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mypage-divider"></div>

            <div className="mypage-tabs">
                <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>내가 쓴 글</button>
                <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>내가 쓴 댓글</button>
                <button className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>내가 푼 문제</button>
                <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>나의 정보</button>
            </div>

            <div className="tab-content" style={{ padding: '40px 0' }}>

                {/* 1. 내가 쓴 글 탭 */}
                {activeTab === 'posts' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>작성한 게시글 총 {myPosts.length}개</h3>
                        {myPosts.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>작성한 게시글이 없습니다.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {myPosts.map(post => (
                                    <li key={`${post.type}-${post.id}`} onClick={() => navigate(`/${post.type}/${post.id}`)} style={{ borderBottom: '1px solid #eee', padding: '15px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', color: '#00bfa5', marginRight: '10px', fontWeight: 'bold' }}>{post.type === 'community' ? '커뮤니티' : '포럼'}</span>
                                            <span style={{ fontSize: '16px', color: '#333' }}>{post.title}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#999' }}>{post.date}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* 2. 내가 쓴 댓글 탭 */}
                {activeTab === 'comments' && (
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>작성한 댓글 총 {myComments.length}개</h3>
                        {myComments.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>작성한 댓글이 없습니다.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {myComments.map(comment => (
                                    <li key={`${comment.type}-${comment.id}`} onClick={() => navigate(`/${comment.type}/${comment.postId}`)} style={{ borderBottom: '1px solid #eee', padding: '15px 0', cursor: 'pointer' }}>
                                        <div style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>{comment.text}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}><span style={{ color: '#00bfa5', marginRight: '8px' }}>{comment.type === 'community' ? '커뮤니티' : '포럼'}</span>{comment.date}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>준비 중인 기능입니다.</div>
                )}

                {/* 4. 나의 정보 서브 탭 렌더링 */}
                {activeTab === 'info' && (
                    <div className="info-container">
                        <aside className="info-sidebar">
                            <h3>설정</h3>
                            <ul>
                                <li className={infoTab === 'account' ? 'active' : ''} onClick={() => setInfoTab('account')}>👤 계정</li>
                                <li className={infoTab === 'social' ? 'active' : ''} onClick={() => setInfoTab('social')}>🚪 간편로그인</li>
                                <li className={infoTab === 'password' ? 'active' : ''} onClick={() => setInfoTab('password')}>🔒 비밀번호</li>
                            </ul>
                        </aside>

                        {renderInfoContent()}
                    </div>
                )}

            </div>

            {/* 비밀번호 변경 모달 */}
            {isPwModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPwModalOpen(false)}>
                    <div className="modal-content" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                        <h3>비밀번호 변경하기</h3>
                        <div className="info-input-group" style={{ marginBottom: '15px' }}>
                            <label>기존 비밀번호</label>
                            <input type="password" placeholder="필수 입력" style={{ backgroundColor: '#fff' }} />
                        </div>
                        <div className="info-input-group" style={{ marginBottom: '15px' }}>
                            <label>새 비밀번호 (필수)</label>
                            <input type="password" placeholder="필수 입력" style={{ backgroundColor: '#fff' }} />
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                                ✔ 최소 8자 이상 ✔ 숫자 1자 이상 포함 ✔ 대소문자 혼합
                            </div>
                        </div>
                        <div className="info-input-group">
                            <label>새 비밀번호 확인 (필수)</label>
                            <input type="password" placeholder="필수 입력" style={{ backgroundColor: '#fff' }} />
                        </div>
                        <button className="modal-save-btn" onClick={() => {
                            alert('비밀번호가 변경되었습니다!');
                            setIsPwModalOpen(false);
                        }}>
                            비밀번호 저장하기
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}