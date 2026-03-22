import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  });

  it('renders the heading', () => {
    render(<App />);
    expect(screen.getByText('Research Connect')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<App />);
    expect(
      screen.getByText(/Frontend.*Backend.*Database/)
    ).toBeInTheDocument();
  });
});
