import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import useExternalLinks from './useExternalLinks';

test('prompts before opening external link', () => {
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  function Comp() {
    useExternalLinks();
    return <a href="https://example.com">ext</a>;
  }
  const { getByText } = render(<Comp />);
  fireEvent.click(getByText('ext'));
  expect(confirmSpy).toHaveBeenCalled();
  expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
});
