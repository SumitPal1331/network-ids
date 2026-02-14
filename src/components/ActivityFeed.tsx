import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'normal' | 'threat' | 'scan';
  message: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Activity Feed</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Waiting for network traffic...
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
              {activity.type === 'normal' && (
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              )}
              {activity.type === 'threat' && (
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              )}
              {activity.type === 'scan' && (
                <Clock size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
