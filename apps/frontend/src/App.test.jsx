import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { NavigationGuardProvider } from './context/NavigationGuardContext';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavigationGuardProvider>
        <App />
      </NavigationGuardProvider>
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  it('renders the home page at /', () => {
    renderAt('/');
    expect(screen.getByText('~/checkpoint — git:(main)')).toBeInTheDocument();
  });

  it('renders the about page at /about', () => {
    renderAt('/about');
    expect(screen.getByText('// experience')).toBeInTheDocument();
  });

  it('renders a 404 page for an unknown public route', () => {
    renderAt('/this-route-does-not-exist');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
