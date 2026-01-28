/**
 * Jyotish Selector Component
 * Displays a searchable list of astrologers with detailed cards
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton,
  Input,
  Button,
} from '@jyotish/ui';
import { QUERY_KEYS } from '@/constants';
import { getImageUrl } from '@/utils/image.utils';
import astrologerService from '@/services/astrologer.service';
import { ASTROLOGER_CATEGORY_LABELS, AstrologerCategory, type AstrologerListParams } from '@/types/astrologer';
import { JyotishSelectorCard } from './JyotishSelectorCard';

interface JyotishSelectorProps {
  selectedAstrologerId: string;
  onSelect: (astrologerId: string) => void;
  onClear: () => void;
}

export function JyotishSelector({ selectedAstrologerId, onSelect, onClear }: JyotishSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Common filters for astrologer list
  const listFilters: AstrologerListParams = {
    isOnline: true,
    search: searchTerm || undefined,
    limit: 50,
  };

  // Fetch astrologers list (only online, non-premium handled via filtering)
  const { data: astrologersData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.LIST(listFilters),
    queryFn: () => astrologerService.listAstrologers(listFilters),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const astrologers = astrologersData?.astrologers || [];
  const selectedAstrologer = astrologers.find((a) => a.id === selectedAstrologerId);

  // - Exclude PREMIUM category from client dashboard dropdown
  const filteredAstrologers = astrologers.filter((astrologer) => {
    if (astrologer.category === AstrologerCategory.PREMIUM) {
      return false;
    }

    if (!astrologer.isOnline) {
      return false;
    }

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      astrologer.name.toLowerCase().includes(search) ||
      astrologer.category.toLowerCase().includes(search) ||
      astrologer.specialization?.some((s) => s.toLowerCase().includes(search)) ||
      astrologer.bio?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-300 block">Select Jyotish</label>
        {selectedAstrologerId && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-white h-auto p-1"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <Select
        value={selectedAstrologerId}
        onValueChange={onSelect}
        onOpenChange={setIsDropdownOpen}
      >
        <SelectTrigger className="w-full">
          {selectedAstrologer ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage
                  src={getImageUrl(selectedAstrologer.profilePhoto) || undefined}
                  alt={selectedAstrologer.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs">
                  {selectedAstrologer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{selectedAstrologer.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                ({ASTROLOGER_CATEGORY_LABELS[selectedAstrologer.category]})
              </span>
            </div>
          ) : (
            <SelectValue placeholder="Select a Jyotish" />
          )}
        </SelectTrigger>
        <SelectContent
          className="w-full p-0 [&_[data-radix-select-viewport]]:!p-0"
          position="popper"
        >
          {/* Search Input inside Dropdown */}
          <div className="sticky top-0 z-10 bg-slate-950 border-b border-white/10 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, category, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Astrologers List with Cards - Full Width */}
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-800/50">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredAstrologers.length === 0 ? (
              <div className="p-4 text-sm text-gray-400 text-center">
                {searchTerm ? 'No astrologers found' : 'No astrologers available'}
              </div>
            ) : (
              <div className="p-2">
                {filteredAstrologers.map((astrologer, index) => (
                  <React.Fragment key={astrologer.id}>
                    {index > 0 && <div className="h-px bg-white/10 my-2 mx-1 rounded-full" />}
                    <SelectItem
                      value={astrologer.id}
                      className="!p-0 !m-0 !pl-0 !pr-0 !pt-0 !pb-0 h-auto focus:bg-transparent data-[highlighted]:bg-transparent cursor-pointer w-full [&>span:first-child]:hidden [&>span:last-child]:!w-full [&>span:last-child]:!block"
                    >
                      <div className="w-full min-w-full">
                        <JyotishSelectorCard
                          astrologer={astrologer}
                          isSelected={selectedAstrologerId === astrologer.id}
                        />
                      </div>
                    </SelectItem>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
