import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './app/Layout.tsx';
import Home from './pages/home/Home.tsx';
import Login from './pages/auth/Login.tsx';
import Signup from './pages/auth/Signup.tsx';
import MyPage from './pages/user/MyPage.tsx';
import Community from './pages/post/Community.tsx';
import CommunityWrite from './pages/post/CommunityWrite.tsx';
import CommunityDetail from './pages/post/CommunityDetail.tsx';
import Gallery from './pages/post/Gallery.tsx';
import GalleryWrite from './pages/post/GalleryWrite.tsx';
import Forum from './pages/post/Forum.tsx';
import ForumWrite from './pages/post/ForumWrite.tsx';
import ForumDetail from './pages/post/ForumDetail.tsx';
import Study from './pages/mission/Study.tsx';
import StudyStep from './pages/mission/StudyStep.tsx';
import StudyMission from './pages/mission/StudyMission.tsx';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 🟢 [Layout 안쪽] 기본 공통 헤더가 나오는 페이지들 */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/mypage" element={<MyPage />} />

                    {/* 커뮤니티 관련 라우트 */}
                    <Route path="/community" element={<Community />} />
                    <Route path="/community/write" element={<CommunityWrite />} />
                    <Route path="/community/:id" element={<CommunityDetail />} />

                    {/* 갤러리 관련 라우트 */}
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/gallery/write" element={<GalleryWrite />} />

                    {/* 포럼 관련 라우트 */}
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/forum/write" element={<ForumWrite />} />
                    {/* 🔥 여기에 포럼 게시글 상세 페이지 라우트 추가! */}
                    <Route path="/forum/:id" element={<ForumDetail />} />

                    {/* 학습 관련 라우트 */}
                    <Route path="/study" element={<Study />} />
                    <Route path="/study/step" element={<StudyStep />} />
                    <Route path="/study/mission" element={<StudyMission />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}