import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { ThreatDetection } from '../types';

interface ThreatCardProps {
  detection: ThreatDetection;
}

export function ThreatCard({ detection }: ThreatCardProps) {
  const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const severityIcons = {
    low: Shield,
    medium: Activity,
    high: AlertTriangle,
    critical: AlertTriangle,
  };

  const SeverityIcon = severityIcons[detection.severity];

  return (
    <div className={`rounded-lg border-2 p-4 ${severityColors[detection.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <SeverityIcon size={20} className="mt-0.5" />
          <div>
            <h4 className="font-semibold">{detection.threat_type}</h4>
            <p className="text-sm opacity-80 mt-1">
              Confidence: {(detection.confidence_score * 100).toFixed(1)}%
            </p>
            <p className="text-xs opacity-70 mt-1">
              {new Date(detection.detected_at).toLocaleString()}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded uppercase ${
          detection.severity === 'critical' ? 'bg-red-200' :
          detection.severity === 'high' ? 'bg-orange-200' :
          detection.severity === 'medium' ? 'bg-yellow-200' :
          'bg-blue-200'
        }`}>
          {detection.severity}
        </span>
      </div>
    </div>
  );
}
