'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { ReviewWithUser } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface ReviewsSectionProps {
  propertyId: string
}

const RATING_CATEGORIES = [
  { key: 'cleanlinessRating', label: 'Cleanliness' },
  { key: 'locationRating', label: 'Location' },
  { key: 'valueRating', label: 'Value for Money' },
  { key: 'safetyRating', label: 'Safety' },
  { key: 'staffRating', label: 'Staff' },
  { key: 'amenitiesRating', label: 'Amenities' },
]

function StarRating({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number
  size?: 'sm' | 'lg'
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const displayed = hovered || rating
  const starClass = size === 'lg' ? 'w-7 h-7' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${starClass} transition-colors ${
              star <= displayed
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-[var(--border)] fill-[var(--border)]'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewsSection({ propertyId }: ReviewsSectionProps) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('recent')
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newReview, setNewReview] = useState({
    overallRating: 0,
    cleanlinessRating: 0,
    locationRating: 0,
    valueRating: 0,
    safetyRating: 0,
    staffRating: 0,
    amenitiesRating: 0,
    title: '',
    content: '',
  })
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', propertyId, page, sortBy],
    queryFn: async () => {
      const { data } = await axios.get(`/api/reviews?propertyId=${propertyId}&page=${page}&limit=5&sortBy=${sortBy}`)
      return data.data
    },
  })

  const submitReview = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/reviews', { propertyId, ...newReview })
      return data
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!')
      setShowWriteReview(false)
      setNewReview({ overallRating: 0, cleanlinessRating: 0, locationRating: 0, valueRating: 0, safetyRating: 0, staffRating: 0, amenitiesRating: 0, title: '', content: '' })
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit review')
    },
  })

  const voteReview = useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      const { data } = await axios.post(`/api/reviews/${reviewId}/vote`, { isHelpful })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] }),
  })

  const aggregate = data?.aggregate
  const distribution = data?.ratingDistribution || {}

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-black text-[var(--text-primary)]">
              {aggregate?.overallRating ? aggregate.overallRating.toFixed(1) : 'New'}
            </div>
            <StarRating rating={aggregate?.overallRating || 0} size="lg" />
            <div className="text-sm text-[var(--text-secondary)] mt-2">{data?.total || 0} reviews</div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star] || 0
              const total = data?.total || 1
              const pct = (count / total) * 100
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] w-2">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-[var(--border)] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] w-4">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Ratings */}
        {aggregate && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
            {RATING_CATEGORIES.map(cat => {
              const rating = aggregate[cat.key as keyof typeof aggregate] as number | null
              if (!rating) return null
              return (
                <div key={cat.key}>
                  <div className="text-xs text-[var(--text-tertiary)] mb-1">{cat.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--border)] rounded-full h-1.5">
                      <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(rating / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{rating.toFixed(1)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Write Review Button */}
      {!showWriteReview && (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
              return
            }
            setShowWriteReview(true)
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      )}

      {/* Write Review Form */}
      {showWriteReview && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border)]"
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">Write Your Review</h3>
          
          <div className="mb-4">
            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 block">Overall Rating *</label>
            <StarRating rating={newReview.overallRating} size="lg" interactive onChange={r => setNewReview(v => ({ ...v, overallRating: r }))} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {RATING_CATEGORIES.map(cat => (
              <div key={cat.key}>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">{cat.label}</label>
                <StarRating
                  rating={newReview[cat.key as keyof typeof newReview] as number}
                  interactive
                  onChange={r => setNewReview(v => ({ ...v, [cat.key]: r }))}
                />
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Review title (optional)"
            value={newReview.title}
            onChange={e => setNewReview(v => ({ ...v, title: e.target.value }))}
            className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm bg-[var(--surface)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] mb-3"
          />

          <textarea
            placeholder="Share your experience... (minimum 20 characters)"
            value={newReview.content}
            onChange={e => setNewReview(v => ({ ...v, content: e.target.value }))}
            rows={4}
            className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm bg-[var(--surface)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowWriteReview(false)}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={() => submitReview.mutate()}
              disabled={newReview.overallRating === 0 || newReview.content.length < 20 || submitReview.isPending}
              className="flex-1 py-3 rounded-xl brand-gradient text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--text-primary)]">{data?.total || 0} Reviews</h3>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-secondary)] outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rated</option>
          <option value="rating_low">Lowest Rated</option>
        </select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="skeleton h-4 rounded w-24" />
                  <div className="skeleton h-3 rounded w-16" />
                </div>
              </div>
              <div className="skeleton h-3 rounded mb-2 w-full" />
              <div className="skeleton h-3 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.reviews?.map((review: ReviewWithUser) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)]">
                  {review.user.avatarUrl ? (
                    <Image src={review.user.avatarUrl} alt={review.user.name || ''} width={40} height={40} className="object-cover" />
                  ) : (
                    <div className="w-full h-full brand-gradient flex items-center justify-center text-white font-bold text-sm">
                      {review.user.name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{review.user.name}</span>
                    {review.isVerified && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Verified Stay</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.overallRating} />
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {format(new Date(review.createdAt), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">{review.title}</h4>
              )}
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{review.content}</p>

              {review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={img} alt={`Review photo ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {review.ownerReply && (
                <div className="mt-3 bg-[var(--bg-secondary)] rounded-xl p-3 border-l-2 border-[var(--primary)]">
                  <div className="text-xs font-semibold text-[var(--primary)] mb-1">Owner Response</div>
                  <p className="text-sm text-[var(--text-secondary)]">{review.ownerReply}</p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--text-tertiary)]">Helpful?</span>
                <button
                  onClick={() => isAuthenticated ? voteReview.mutate({ reviewId: review.id, isHelpful: true }) : router.push('/login')}
                  className={`flex items-center gap-1.5 text-xs ${review.userVote?.isHelpful ? 'text-green-600' : 'text-[var(--text-tertiary)] hover:text-green-600'} transition-colors`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Yes ({review.helpfulCount})
                </button>
                <button
                  onClick={() => isAuthenticated ? voteReview.mutate({ reviewId: review.id, isHelpful: false }) : router.push('/login')}
                  className={`flex items-center gap-1.5 text-xs ${review.userVote && !review.userVote.isHelpful ? 'text-red-500' : 'text-[var(--text-tertiary)] hover:text-red-500'} transition-colors`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  No
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm disabled:opacity-40">Previous</button>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
