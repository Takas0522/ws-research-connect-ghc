import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { Layout } from './components/Layout/Layout'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MasterPage } from './pages/MasterPage'
import { ContractsPage } from './pages/ContractsPage'
import { ImportPage } from './pages/ImportPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'master', element: <MasterPage /> },
          { path: 'contracts', element: <ContractsPage /> },
          { path: 'import', element: <ImportPage /> },
        ],
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
