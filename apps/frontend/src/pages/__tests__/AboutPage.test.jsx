import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage from '../AboutPage';

describe('AboutPage', () => {
  it('renders the professional experience, stack, and publications sections', () => {
    render(<AboutPage />);

    expect(screen.getByText('// experience')).toBeInTheDocument();
    expect(screen.getByText('// stack')).toBeInTheDocument();
    expect(screen.getByText('// projects')).toBeInTheDocument();
    expect(screen.getByText(/resilient kannada scene text detection/i)).toBeInTheDocument();
  });
});
