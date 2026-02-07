import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieConsent, { trackPageView } from './components/CookieConsent'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import About from './pages/About'
import Knowledge from './pages/Knowledge'
import Contact from './pages/Contact'
import AdminLogin from './admin/AdminLogin'
import Dashboard from './admin/Dashboard'
import JewelryManager from './admin/JewelryManager'
import ImageManager from './admin/ImageManager'
import ContentEditor from './admin/ContentEditor'
import GalleryManager from './admin/GalleryManager'

// 页面跟踪组件
function PageTracker() {
    const location = useLocation()

    useEffect(() => {
        // 仅跟踪前台页面
        if (!location.pathname.startsWith('/admin')) {
            trackPageView(location.pathname)
        }
    }, [location.pathname])

    return null
}

function App() {
    return (
        <BrowserRouter>
            <PageTracker />
            <Routes>
                {/* 前台页面 */}
                <Route path="/" element={
                    <>
                        <Navbar />
                        <Home />
                        <Footer />
                        <CookieConsent />
                    </>
                } />
                <Route path="/gallery" element={
                    <>
                        <Navbar />
                        <Gallery />
                        <Footer />
                        <CookieConsent />
                    </>
                } />
                <Route path="/about" element={
                    <>
                        <Navbar />
                        <About />
                        <Footer />
                        <CookieConsent />
                    </>
                } />
                <Route path="/knowledge" element={
                    <>
                        <Navbar />
                        <Knowledge />
                        <Footer />
                        <CookieConsent />
                    </>
                } />
                <Route path="/contact" element={
                    <>
                        <Navbar />
                        <Contact />
                        <Footer />
                        <CookieConsent />
                    </>
                } />

                {/* 后台管理页面 */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/jewelry" element={<JewelryManager />} />
                <Route path="/admin/images" element={<ImageManager />} />
                <Route path="/admin/content" element={<ContentEditor />} />
                <Route path="/admin/gallery" element={<GalleryManager />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

