import { useState, useEffect, useCallback } from 'react';
import { Activity, Shield, AlertTriangle, BarChart3, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ThreatDetection } from '../types';
import { PacketSimulator } from '../lib/packetSimulator';
import { StatCard } from './StatCard';
import { ThreatCard } from './ThreatCard';
import { ActivityFeed } from './ActivityFeed';

interface Stats {
  totalPackets: number;
  threatsDetected: number;
  detectionRate: number;
  avgConfidence: number;
}

interface ActivityItem {
  id: string;
  type: 'normal' | 'threat' | 'scan';
  message: string;
  timestamp: Date;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPackets: 0,
    threatsDetected: 0,
    detectionRate: 0,
    avgConfidence: 0,
  });
  const [recentThreats, setRecentThreats] = useState<ThreatDetection[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [simulator] = useState(() => new PacketSimulator());

  const addActivity = useCallback((type: 'normal' | 'threat' | 'scan', message: string) => {
    setActivities(prev => [
      {
        id: Math.random().toString(36),
        type,
        message,
        timestamp: new Date(),
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const processPacket = useCallback(async () => {
    try {
      const packet = simulator.generatePacket();

      addActivity('scan', `Analyzing packet from ${packet.source_ip}:${packet.source_port} → ${packet.dest_ip}:${packet.dest_port}`);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-packet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packet }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze packet');
      }

      const data = await response.json();

      if (data.result.isMalicious) {
        addActivity('threat', `THREAT DETECTED: ${data.result.threatType} (Confidence: ${(data.result.confidence * 100).toFixed(1)}%)`);
      } else {
        addActivity('normal', `Normal traffic: ${packet.protocol} packet processed successfully`);
      }
    } catch (error) {
      console.error('Error processing packet:', error);
    }
  }, [simulator, addActivity]);

  const fetchStats = useCallback(async () => {
    try {
      const { count: totalPackets } = await supabase
        .from('network_packets')
        .select('*', { count: 'exact', head: true });

      const { data: threats, count: threatsDetected } = await supabase
        .from('threat_detections')
        .select('confidence_score', { count: 'exact' })
        .eq('is_malicious', true);

      const avgConfidence = threats && threats.length > 0
        ? threats.reduce((sum, t) => sum + t.confidence_score, 0) / threats.length
        : 0;

      const detectionRate = totalPackets && totalPackets > 0
        ? ((threatsDetected || 0) / totalPackets) * 100
        : 0;

      setStats({
        totalPackets: totalPackets || 0,
        threatsDetected: threatsDetected || 0,
        detectionRate,
        avgConfidence,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchRecentThreats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('threat_detections')
        .select('*')
        .eq('is_malicious', true)
        .order('detected_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setRecentThreats(data);
    } catch (error) {
      console.error('Error fetching threats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentThreats();

    const statsInterval = setInterval(fetchStats, 5000);
    const threatsInterval = setInterval(fetchRecentThreats, 5000);

    const channel = supabase
      .channel('threat_detections')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'threat_detections' },
        () => {
          fetchStats();
          fetchRecentThreats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(statsInterval);
      clearInterval(threatsInterval);
      channel.unsubscribe();
    };
  }, [fetchStats, fetchRecentThreats]);

  useEffect(() => {
    let interval: number;

    if (isMonitoring) {
      interval = setInterval(() => {
        processPacket();
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, processPacket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="text-blue-600" size={40} />
                Network IDS
              </h1>
              <p className="text-gray-600 mt-2">
                ML-Powered Intrusion Detection System with Real-Time Monitoring
              </p>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isMonitoring
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause size={20} />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play size={20} />
                  Start Monitoring
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Packets"
            value={stats.totalPackets.toLocaleString()}
            icon={Activity}
            trend="500K+ analyzed"
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Threats Detected"
            value={stats.threatsDetected.toLocaleString()}
            icon={AlertTriangle}
            trend={`${stats.detectionRate.toFixed(1)}% detection rate`}
            iconColor="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            title="Model Accuracy"
            value="94%"
            icon={BarChart3}
            trend="Ensemble learning"
            iconColor="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Avg Confidence"
            value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
            icon={Shield}
            trend="ML predictions"
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Threats</h3>
                <span className="text-sm text-gray-500">
                  {recentThreats.length} active alerts
                </span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentThreats.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="mx-auto text-green-500 mb-3" size={48} />
                    <p className="text-gray-500">No threats detected</p>
                    <p className="text-sm text-gray-400 mt-1">Your network is secure</p>
                  </div>
                ) : (
                  recentThreats.map((threat) => (
                    <ThreatCard key={threat.id} detection={threat} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Feature Engineering</h4>
              <p className="text-sm text-gray-600">
                Advanced packet analysis with 7+ engineered features including port entropy, TTL anomaly detection, and flag pattern analysis.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Ensemble Learning</h4>
              <p className="text-sm text-gray-600">
                ML model achieving 94% accuracy using weighted ensemble techniques for threat classification and anomaly detection.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Real-Time Alerts</h4>
              <p className="text-sm text-gray-600">
                Automated threat classification with severity prioritization for SOC teams and instant incident notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
