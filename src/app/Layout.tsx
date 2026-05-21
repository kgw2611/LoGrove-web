// src/app/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../widgets/header/Header'
import CasualPhotoFloatingButton from '../widgets/casualPhoto/CasualPhotoFloatingButton'

const Layout = () => {
    const location = useLocation()
    const hideCasualPhotoButton = ['/login', '/signup'].some((path) =>
        location.pathname.startsWith(path)
    )

    return (
        <div className="app-layout">
            {/* 🌟 전 지역 공통으로 항상 떠 있는 헤더! */}
            <Header />

            {/* 🌟 주소에 따라 내용(Home, Community 등)이 바뀌면서 들어갈 자리! */}
            <main className="main-content">
                <Outlet />
            </main>
            {!hideCasualPhotoButton && <CasualPhotoFloatingButton />}
        </div>
    )
}

export default Layout
