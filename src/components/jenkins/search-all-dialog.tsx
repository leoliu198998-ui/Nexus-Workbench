'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: string[];
  onSelect: (item: string) => void;
  loading?: boolean;
}

export function SearchAllDialog({ open, onOpenChange, title, items, onSelect, loading = false }: SearchAllDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="h-[300px] overflow-y-auto border rounded-md p-2 space-y-1">
            {loading ? (
               <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
            ) : filteredItems.length === 0 ? (
               <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No results found</div>
            ) : (
              filteredItems.map(item => (
                <Button
                  key={item}
                  variant="ghost"
                  className="w-full justify-start font-normal h-8 truncate"
                  title={item}
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                    setSearchTerm('');
                  }}
                >
                  {item}
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}