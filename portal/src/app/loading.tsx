export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <span className="ml-3 text-gray-500">Loading...</span>
    </div>
  );
}
