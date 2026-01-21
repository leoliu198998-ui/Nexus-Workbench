import { render, screen, fireEvent } from '@testing-library/react';
import { Wizard, WizardStep } from './wizard';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';

const TokenStepContent = ({ next }: { next: () => void }) => {
  const [token, setToken] = useState('');
  return (
    <div className="space-y-4">
      <input 
        placeholder="Enter Token" 
        value={token} 
        onChange={(e) => setToken(e.target.value)} 
      />
      <button disabled={!token} onClick={next}>Next</button>
    </div>
  );
};

describe('Token Step', () => {
  it('disables next button if token is empty', () => {
    render(
      <Wizard>
        <WizardStep title="Token">
          {(next) => <TokenStepContent next={next} />}
        </WizardStep>
        <WizardStep title="Next Step">
          <div>Next Step Content</div>
        </WizardStep>
      </Wizard>
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDefined();
    // @ts-ignore
    expect(nextButton.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Enter Token'), { target: { value: 'my-token' } });
    // @ts-ignore
    expect(nextButton.disabled).toBe(false);
  });
});
