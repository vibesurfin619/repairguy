interface DashboardStatsProps {
  stats: {
    totalItems: number;
    totalUsers: number;
    totalOutstandingRepairs: number;
    totalInProgressRepairs: number;
    totalCompletedRepairs: number;
    totalFailedRepairs: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Outstanding Repairs",
      value: stats.totalOutstandingRepairs,
      color: "orange" as const,
      description: "Pending repairs",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "In Progress Repairs",
      value: stats.totalInProgressRepairs,
      color: "blue" as const,
      description: "Currently being worked on",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Completed Repairs",
      value: stats.totalCompletedRepairs,
      color: "green" as const,
      description: "Successfully completed",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Total Items",
      value: stats.totalItems,
      color: "green" as const,
      description: "Items in system",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      color: "purple" as const,
      description: "Registered technicians",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    },
    {
      title: "Failed Repairs",
      value: stats.totalFailedRepairs,
      color: "red" as const,
      description: "Repairs that failed",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <>
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal' | 'red';
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, color, description, icon }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  const iconClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
    red: 'text-red-600'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {value.toLocaleString()}
          </p>
          <p className="text-sm opacity-75 mt-1">{description}</p>
        </div>
        <div className={`${iconClasses[color]} opacity-75`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
