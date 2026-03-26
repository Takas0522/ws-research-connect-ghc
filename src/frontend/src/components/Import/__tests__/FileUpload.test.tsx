import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../FileUpload'

describe('FileUpload', () => {
  test('renders file upload area', () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)

    expect(screen.getByText('CSVファイルアップロード')).toBeInTheDocument()
    expect(screen.getByText(/CSVファイルをドラッグ＆ドロップ/)).toBeInTheDocument()
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
  })

  test('handles file selection', async () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)

    const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSVファイル選択') as HTMLInputElement

    await userEvent.upload(input, file)

    expect(screen.getByText('test.csv')).toBeInTheDocument()
  })

  test('shows upload button after file selection', async () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)

    const file = new File(['data'], 'data.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSVファイル選択') as HTMLInputElement

    await userEvent.upload(input, file)

    expect(screen.getByText('アップロード')).toBeInTheDocument()
  })

  test('calls onUpload when upload button is clicked', async () => {
    const handleUpload = vi.fn()
    const user = userEvent.setup()

    render(<FileUpload onUpload={handleUpload} isUploading={false} />)

    const file = new File(['data'], 'upload.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSVファイル選択') as HTMLInputElement

    await userEvent.upload(input, file)
    await user.click(screen.getByText('アップロード'))

    expect(handleUpload).toHaveBeenCalledWith(file)
  })

  test('shows uploading state', async () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={true} />)

    // First select a file so the upload button appears
    const file = new File(['data'], 'data.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSVファイル選択') as HTMLInputElement
    await userEvent.upload(input, file)

    expect(screen.getByText('アップロード中...')).toBeInTheDocument()
  })

  test('handles drag and drop of CSV file', () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)

    const dropZone = screen.getByText(/CSVファイルをドラッグ＆ドロップ/).closest('div')!

    const file = new File(['data'], 'drop.csv', { type: 'text/csv' })
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: 'text/csv', getAsFile: () => file }],
      types: ['Files'],
    }

    fireEvent.dragOver(dropZone, { dataTransfer })
    fireEvent.drop(dropZone, { dataTransfer })

    expect(screen.getByText('drop.csv')).toBeInTheDocument()
  })

  test('clicking "ファイルを選択" triggers file input', async () => {
    const user = userEvent.setup()
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)

    const input = screen.getByLabelText('CSVファイル選択') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    await user.click(screen.getByText('ファイルを選択'))

    expect(clickSpy).toHaveBeenCalled()
  })
})
