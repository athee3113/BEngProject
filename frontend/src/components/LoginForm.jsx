import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './LoginForm.css'

function LoginForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await authAPI.login(formData.email, formData.password)
      console.log('Login response:', response)
      console.log('User role from response:', response.user?.role)
      
      // Store the token in localStorage if rememberMe is checked
      if (formData.rememberMe) {
        localStorage.setItem('token', response.access_token)
      } else {
        sessionStorage.setItem('token', response.access_token)
      }
      // Store user info
      localStorage.setItem('userInfo', JSON.stringify(response.user))
      
      // Redirect to dashboard based on user role
      const userRole = response.user.role ? response.user.role.toUpperCase() : '';
      console.log('Normalized user role:', userRole)
      
      if (userRole === 'BUYER') {
        console.log('Navigating to buyer dashboard')
        navigate('/dashboard/buyer');
      } else if (userRole === 'SELLER') {
        console.log('Navigating to seller dashboard')
        navigate('/dashboard/seller');
      } else if (userRole.includes('SOLICITOR')) {
        console.log('Navigating to solicitor dashboard')
        navigate('/dashboard/solicitor');
      } else if (userRole === 'ESTATE_AGENT') {
        console.log('Navigating to estate agent dashboard')
        navigate('/dashboard/estate-agent');
      } else {
        console.log('No matching role, navigating to home')
        navigate('/');
      }
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="form-header">
          <Link to="/" className="logo-link">
            <h2 className="logo">Conveyancer</h2>
          </Link>
        </div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Please enter your details to sign in</p>

        {apiError && <div className="error-message">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginForm 