'use client';

/**
 * InlineChatRating Component
 * Inline rating component that appears in chat after session ends
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { ratingService } from '@/services/rating.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { toast } from 'sonner';
import { Button, Textarea } from '@jyotish/ui';
import type { CreateRatingRequest } from '@/types/rating';
import { LoadingButton } from '@/components/ui';

interface InlineChatRatingProps {
  chatId: string;
  astrologerId: string;
  astrologerName: string;
  clientId: string;
}

export function InlineChatRating({
  chatId,
  astrologerId,
  astrologerName,
  clientId,
}: InlineChatRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  // Check if already rated
  const { data: existingRating, isLoading: isCheckingRating } = useQuery({
    queryKey: QUERY_KEYS.RATINGS.CHAT(chatId),
    queryFn: () => ratingService.getChatRating(chatId),
    staleTime: Infinity, // Rating doesn't change once submitted
  });

  const submitRatingMutation = useMutation({
    mutationFn: (data: CreateRatingRequest) => ratingService.createRating(data),
    onSuccess: () => {
      toast.success('Thank you for rating this session!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RATINGS.CHAT(chatId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RATINGS.ASTROLOGER(astrologerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.DETAIL(astrologerId) });
      setIsExpanded(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit rating');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    submitRatingMutation.mutate({
      chatId,
      astrologerId,
      rating,
      feedback: feedback.trim() || undefined,
    });
  };

  // If already rated, show the submitted rating
  if (existingRating?.data?.rating) {
    const ratingData = existingRating.data.rating;
    return (
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 mx-4 my-2 rounded-r-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900 mb-1">You rated this session</p>
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < ratingData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-700 font-medium">{ratingData.rating}/5</span>
            </div>
            {ratingData.feedback && (
              <p className="text-sm text-gray-600 italic">&ldquo;{ratingData.feedback}&rdquo;</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If checking rating status
  if (isCheckingRating) {
    return (
      <div className="px-4 py-3 bg-gray-50 mx-4 my-2 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  // Show rating form if not rated yet
  if (!isExpanded) {
    return null;
  }

  return (
    <div className="px-4 py-4 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border-l-4 border-purple-500 mx-4 my-2 rounded-r-lg shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Rate Your Experience</h4>
            <p className="text-xs text-gray-600">How was your session with {astrologerName}?</p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2 justify-center py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none active:scale-95"
              disabled={submitRatingMutation.isPending}
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        {rating > 0 && (
          <p className="text-center text-sm font-semibold text-gray-800">
            {rating === 1 && '😞 Poor'}
            {rating === 2 && '😐 Fair'}
            {rating === 3 && '🙂 Good'}
            {rating === 4 && '😊 Very Good'}
            {rating === 5 && '🤩 Excellent'}
          </p>
        )}

        {/* Feedback Textarea */}
        <div className="space-y-1">
          <label htmlFor="inline-feedback" className="text-xs text-gray-600 font-medium">
            Share your feedback (optional)
          </label>
          <Textarea
            id="inline-feedback"
            placeholder="Tell us about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm min-h-[60px] bg-white hover:bg-white/10"
            maxLength={500}
            disabled={submitRatingMutation.isPending}
          />
          <p className="text-xs text-gray-500 text-right">{feedback.length}/500</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsExpanded(false)}
            variant="outline"
            size="sm"
            className="flex-1 text-white"
            disabled={submitRatingMutation.isPending}
          >
            Skip for now
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            isLoading={submitRatingMutation.isPending}
            size="sm"
            className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            disabled={rating === 0}
          >
            Submit Rating
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
