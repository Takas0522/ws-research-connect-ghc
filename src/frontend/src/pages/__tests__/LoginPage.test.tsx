import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useAuth } from '../../hooks/useAuth'

const mockedUseAuth = vi.mocked(useAuth)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  })
})

describe('LoginPage', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('SaaS管理アプリ')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  test('submits form with credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('メールアドレス'), 'admin@test.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123')
  })

  test('shows error on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('メールアドレス'), 'bad@test.com')
    await user.type(screen.getByLabelText('パスワード'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(
      await screen.findByText('メールアドレスまたはパスワードが正しくありません'),
    ).toBeInTheDocument()
  })

  test('shows loading spinner when auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('SaaS管理アプリ')).not.toBeInTheDocument()
  })

  test('redirects when already authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@test.com',
        display_name: 'Admin',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      loading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('SaaS管理アプリ')).not.toBeInTheDocument()
  })
})
