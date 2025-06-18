import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './SignupForm.css'

function SignupForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phoneNumber: '',
    companyName: '',
    companyAddress: '',
    registrationNumber: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    }
    if (formData.role === 'Solicitor' || formData.role === 'Estate Agent') {
      if (!formData.companyName) {
        newErrors.companyName = 'Company name is required'
      }
      if (!formData.registrationNumber) {
        newErrors.registrationNumber = 'Registration number is required'
      }
      // companyAddress is optional
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
      await authAPI.signup(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.role ? formData.role.toUpperCase() : '',
        formData.phoneNumber,
        formData.companyName,
        formData.companyAddress,
        formData.registrationNumber
      )
      navigate('/login')
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const showCompanyFields = formData.role === 'Solicitor' || formData.role === 'Estate Agent'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <div className="mb-6 text-center">
          <Link to="/" className="text-3xl font-extrabold text-blue-600">Conveyancer</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-gray-500 mb-6">Please fill in your details to sign up</p>
        {apiError && <div className="w-full bg-red-100 text-red-700 rounded-lg px-4 py-2 mb-4 text-center">{apiError}</div>}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.firstName ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
                placeholder="Enter your first name"
              />
              {errors.firstName && <span className="text-xs text-red-600">{errors.firstName}</span>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.lastName ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
                placeholder="Enter your last name"
              />
              {errors.lastName && <span className="text-xs text-red-600">{errors.lastName}</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
              placeholder="Enter your email"
            />
            {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.phoneNumber ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
              placeholder="Enter your phone number"
            />
            {errors.phoneNumber && <span className="text-xs text-red-600">{errors.phoneNumber}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.password ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
              placeholder="Create a password"
            />
            {errors.password && <span className="text-xs text-red-600">{errors.password}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <span className="text-xs text-red-600">{errors.confirmPassword}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">Select your role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.role ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
              required
            >
              <option value="">-- Select Role --</option>
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Solicitor">Solicitor</option>
              <option value="Estate Agent">Estate Agent</option>
            </select>
            {errors.role && <span className="text-xs text-red-600">{errors.role}</span>}
          </div>
          {showCompanyFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${errors.companyName ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
                  placeholder="Enter your company name"
                />
                {errors.companyName && <span className="text-xs text-red-600">{errors.companyName}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="companyAddress">Company Address (optional)</label>
                <input
                  type="text"
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter your company address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="registrationNumber">Registration Number</label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${errors.registrationNumber ? 'border-red-400' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200`}
                  placeholder={formData.role === 'Solicitor' ? 'Enter your SRA number' : 'Enter your company registration number'}
                />
                {errors.registrationNumber && <span className="text-xs text-red-600">{errors.registrationNumber}</span>}
              </div>
            </>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-colors duration-200 mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default SignupForm 