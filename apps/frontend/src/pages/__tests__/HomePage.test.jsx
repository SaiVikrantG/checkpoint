import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';

describe('HomePage', () => {
  it('renders the landing tiles without crashing', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('checkpoint').length).toBeGreaterThan(0);
    expect(screen.getByText('articles')).toBeInTheDocument();
    expect(screen.getByText('projects')).toBeInTheDocument();
    expect(screen.getByText('about_me')).toBeInTheDocument();
  });
});
