interface SOPViewerProps {
  sopUrl: string;
  workflowName: string;
  repairType: string;
  sku?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SOPViewer({ 
  sopUrl, 
  workflowName, 
  repairType, 
  sku, 
  size = 'md',
  className = '' 
}: SOPViewerProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <a
      href={sopUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-blue-600 hover:bg-blue-700 text-white rounded font-medium inline-flex items-center space-x-2 ${sizeClasses[size]} ${className}`}
      title={`View SOP for ${workflowName} - ${repairType}${sku ? ` (SKU: ${sku})` : ''}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>View SOP</span>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}