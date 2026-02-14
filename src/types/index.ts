export interface NetworkPacket {
  id: string;
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  packet_size: number;
  flags?: string;
  payload_size: number;
  ttl: number;
  created_at: string;
}

export interface ThreatDetection {
  id: string;
  packet_id: string;
  threat_type: string;
  confidence_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_malicious: boolean;
  features_vector: Record<string, any>;
  model_version: string;
  detected_at: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affected_ips: string[];
  detection_count: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SystemStats {
  id: string;
  timestamp: string;
  total_packets: number;
  threats_detected: number;
  detection_rate: number;
  false_positive_rate: number;
  avg_confidence: number;
  top_threat_types: Record<string, number>;
}
