import { Link } from 'react-router-dom'
import { BoltIcon, LockClosedIcon, UsersIcon } from '@heroicons/react/24/solid'
import './HomePage.css'

function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 60%, #fef6e4 100%)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-blue-600 drop-shadow-sm">
            Conveyancer
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-200">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors duration-200">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      <div className="h-20" />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] w-full overflow-hidden" style={{ background: 'linear-gradient(120deg, #6dd5ed 0%, #b19cd9 60%, #fef6e4 100%)' }}>
        {/* Decorative blurred circles */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '-120px',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, #6dd5ed 60%, transparent 100%)',
          opacity: 0.25,
          filter: 'blur(40px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, #fbbf24 60%, transparent 100%)',
          opacity: 0.18,
          filter: 'blur(32px)',
          zIndex: 0
        }} />
        <div className="max-w-3xl mx-auto text-center px-4 py-16" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-gray-900 drop-shadow-lg">
            Welcome to <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-yellow-400 bg-clip-text text-transparent">Conveyancer</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Streamline your property conveyancing process with ease and transparency.
          </p>
          <Link to="/signup" className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors duration-200">
            Get Started
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-2 bg-gradient-to-r from-blue-100 via-purple-100 to-yellow-100" />

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Conveyancer?</h2>
            <p className="text-lg text-gray-500">Everything you need for a seamless, secure, and collaborative property transaction.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                <BoltIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 text-center">Track Every Step in Real Time</h3>
              <p className="text-gray-600 text-center">Stay fully informed from offer to completion. Our live progress tracker keeps you and all parties aligned with clear timelines, stage updates, and alerts — no more chasing for answers.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-yellow-100">
                <LockClosedIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 text-center">Secure, Centralised Document Hub</h3>
              <p className="text-gray-600 text-center">Easily upload, review, and store all required documents in one place. From ID checks to surveys and contracts, everything is encrypted, organised, and accessible to those who need it.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-100">
                <UsersIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 text-center">Built for Seamless Collaboration</h3>
              <p className="text-gray-600 text-center">Connect buyers, sellers, agents, and solicitors in one shared space. Assign tasks, manage approvals, and keep everyone on the same page — all without endless email threads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-500 to-yellow-400">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow">Ready to simplify your property transaction?</h2>
          <p className="text-lg text-white/90 mb-8 drop-shadow">Join thousands of satisfied clients who have streamlined their conveyancing process with us.</p>
          <Link to="/signup" className="inline-block px-8 py-3 rounded-lg bg-white text-blue-700 font-semibold text-lg shadow-lg hover:bg-gray-100 transition-colors duration-200">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage 