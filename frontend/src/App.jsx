import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import QrPublicPage from './pages/QrPublicPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
export default function App(){
  return (
    <div>
      <nav style={{background:'#fff', position:'sticky', top:0, zIndex:10, borderBottom:'1px solid #eee', padding:'10px', display:'flex', gap:12}}>
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div style={{padding:20}}>Scan a QR to land on <code>/q/:slug</code>.</div>} />
        <Route path="/q/:slug" element={<QrPublicPage/>} />
        <Route path="/admin" element={<AdminPage/>} />
      </Routes>
    </div>
  )
}
