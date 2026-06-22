type LoadingSkeletonProps = {
  count?: number
  className?: string
}

export const LoadingSkeleton = ({ count = 8, className = 'h-36 bg-gray-100 rounded-2xl animate-pulse' }: LoadingSkeletonProps) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className={className} />
    ))}
  </>
)
