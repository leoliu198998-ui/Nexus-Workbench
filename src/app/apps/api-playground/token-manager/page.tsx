'use client';

import ButterTokenManager from '../components/butter-token-manager';
import TaxTokenManager from '../components/tax-token-manager';

export default function TokenManagerPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Token Manager</h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage access tokens for various systems.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ButterTokenManager />
        <TaxTokenManager />
      </div>
    </div>
  );
}
