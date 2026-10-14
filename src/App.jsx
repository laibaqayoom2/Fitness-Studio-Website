// src/App.jsx
import Header from './components/Header'
import Hero from './components/Hero'
import MainPage from './components/MainPage'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:bg-white focus:px-4 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <MainPage />
      </main>
      <Footer />
    </>
  )
}