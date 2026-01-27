'use client';

/**
 * RatingModal Component
 * Modal to rate an astrologer after a chat session ends
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { ratingService } from '@/services/rating.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Textarea,
} from '@jyotish/ui';
import type { CreateRatingRequest } from '@/types/rating';
import { LoadingButton } from '@/components/ui';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  astrologerId: string;
  astrologerName: string;
  astrologerPhoto?: string | null;
}

export function RatingModal({
  isOpen,
  onClose,
  chatId,
  astrologerId,
  astrologerName,
  astrologerPhoto,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const submitRatingMutation = useMutation({
    mutationFn: (data: CreateRatingRequest) => ratingService.createRating(data),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RATINGS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RATINGS.ASTROLOGER(astrologerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.DETAIL(astrologerId) });
      onClose();
      setRating(0);
      setFeedback('');
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

  const handleSkip = () => {
    onClose();
    setRating(0);
    setFeedback('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl text-center">
            Rate Your Experience
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-center">
            How was your chat with {astrologerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Astrologer Info */}
          {astrologerPhoto && (
            <div className="flex justify-center">
              <Image
                src={astrologerPhoto}
                alt={astrologerName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full border-2 border-purple-500 object-cover"
              />
            </div>
          )}

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                disabled={submitRatingMutation.isPending}
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          {/* Rating Text */}
          {rating > 0 && (
            <p className="text-center text-white font-semibold">
              {rating === 1 && '😞 Poor'}
              {rating === 2 && '😐 Fair'}
              {rating === 3 && '🙂 Good'}
              {rating === 4 && '😊 Very Good'}
              {rating === 5 && '🤩 Excellent'}
            </p>
          )}

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm text-gray-300">
              Share your experience (optional)
            </label>
            <Textarea
              id="feedback"
              placeholder="Tell us about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:bg-white/20 min-h-[100px]"
              maxLength={500}
              disabled={submitRatingMutation.isPending}
            />
            <p className="text-xs text-gray-400 text-right">{feedback.length}/500</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={submitRatingMutation.isPending}
            >
              Skip
            </Button>
            <LoadingButton
              onClick={handleSubmit}
              isLoading={submitRatingMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={rating === 0}
            >
              Submit Rating
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
