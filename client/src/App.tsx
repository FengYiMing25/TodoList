import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import Layout from '@components/Layout'
import Login from '@pages/Login'
import Register from '@pages/Register'
import Dashboard from '@pages/Dashboard'
import TodoList from '@pages/TodoList'
import Categories from '@pages/Categories'
import Settings from '@pages/Settings'
import NotFound from '@pages/NotFound'
import AccountBook from '@pages/AccountBook'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return null
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return null
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  const { checkAuth, token } = useAuthStore()

  useEffect(() => {
    if (token) {
      checkAuth()
    }
  }, [])

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="todos" element={<TodoList />} />
        <Route path="accounts" element={<AccountBook />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
