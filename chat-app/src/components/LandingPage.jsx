import { Link } from 'react-router-dom'
import { MessageCircle, Users, Shield, Zap, Star, ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { authAPI } from '../services/api'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Test API connection
  const testConnection = async () => {
    try {
      console.log('Testing API connection...')
      const response = await fetch('http://localhost:5000/api/health')
      const data = await response.json()
      console.log('API Health Check:', data)
      alert(`API Connection: ${data.status} - ${data.message}`)
    } catch (error) {
      console.error('API Connection Error:', error)
      alert('API Connection Failed: ' + error.message)
    }
  }

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-600" />,
      title: "Real-time Messaging",
      description: "Instant messaging with real-time delivery and read receipts"
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Group Chats",
      description: "Create and manage group conversations with unlimited members"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Secure & Private",
      description: "End-to-end encryption ensures your conversations stay private"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: "Lightning Fast",
      description: "Optimized for speed with instant message delivery"
    }
  ]

  // Testimonials will be loaded from API in the future
  const testimonials = []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ChatFlow</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Testimonials</a>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</Link>
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Get Started</Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium">Features</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium">Testimonials</a>
              <Link to="/login" className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium">Login</Link>
              <Link to="/signup" className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium text-center">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Connect, Chat, and
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Collaborate</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
              Experience the future of messaging with our beautiful, fast, and secure chat application.
              Connect with friends, family, and teams like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.4s'}}>
              <Link
                to="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Chatting Now
                <ArrowRight className="inline-block w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:bg-gray-50"
              >
                Sign In
              </Link>
              <button
                onClick={testConnection}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                Test API Connection
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Communication
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for seamless communication, all in one beautiful package
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 border border-gray-100 animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say about ChatFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{animationDelay: `${index * 0.2}s`}}
                >
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-500 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Join thousands of users who love ChatFlow!
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Be the first to share your experience
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have already made the switch to ChatFlow
          </p>
          <Link 
            to="/signup" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <MessageCircle className="w-8 h-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">ChatFlow</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 ChatFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
