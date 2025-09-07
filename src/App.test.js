import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Piuma header', () => {
  render(<App />);
  const header = screen.getByText(/Piuma/i);
  expect(header).toBeInTheDocument();
});
