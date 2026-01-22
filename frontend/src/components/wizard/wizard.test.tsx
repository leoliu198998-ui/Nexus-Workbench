import { render, screen, fireEvent } from '@testing-library/react';
import { Wizard, WizardStep } from './wizard';
import { describe, it, expect } from 'vitest';

describe('Wizard Component', () => {
  it('renders the first step by default', () => {
    render(
      <Wizard>
        <WizardStep title="Step 1">
          <div>Step 1 Content</div>
        </WizardStep>
        <WizardStep title="Step 2">
          <div>Step 2 Content</div>
        </WizardStep>
      </Wizard>
    );

    expect(screen.getByText('Step 1 Content')).toBeDefined();
    expect(screen.queryByText('Step 2 Content')).toBeNull();
  });

  it('navigates to the next step when a button is clicked', async () => {
    // This is a generic test, I will need to implement a way to trigger navigation
    // Maybe the Wizard provides a context or passes props
    render(
      <Wizard>
        <WizardStep title="Step 1">
          {(next) => (
            <div>
              Step 1 Content
              <button onClick={next}>Next</button>
            </div>
          )}
        </WizardStep>
        <WizardStep title="Step 2">
          <div>Step 2 Content</div>
        </WizardStep>
      </Wizard>
    );

    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('Step 2 Content')).toBeDefined();
    expect(screen.queryByText('Step 1 Content')).toBeNull();
  });
});
