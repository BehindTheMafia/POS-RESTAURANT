import { Navigate } from 'react-router'
import { useAuthContext } from './AuthContext'
import { getDefaultRoute } from '../lib/routing'

export const HomeRedirect = () => {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <Navigate to={getDefaultRoute(user)} replace />
}
