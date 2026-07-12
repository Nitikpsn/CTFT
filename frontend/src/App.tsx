import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compare from './pages/Compare'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare/:sessionId" element={<Compare />} />
          <Route path="/reports/:sessionId" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
