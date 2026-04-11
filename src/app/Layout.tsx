// src/app/Layout.tsx
import { Outlet } from 'react-router-dom'
import Header from '../widgets/header/Header'

const Layout = () => {
    return (
        <div className="app-layout">
            {/* 🌟 전 지역 공통으로 항상 떠 있는 헤더! */}
            <Header />

            {/* 🌟 주소에 따라 내용(Home, Community 등)이 바뀌면서 들어갈 자리! */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout