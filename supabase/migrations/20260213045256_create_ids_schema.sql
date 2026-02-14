/*
  # Network Intrusion Detection System Schema

  ## Overview
  Complete database schema for ML-powered Network Intrusion Detection System
  with real-time monitoring, threat classification, and incident management.

  ## New Tables

  ### 1. `network_packets`
  Stores captured network packet data with extracted features for ML analysis
  - `id` (uuid, primary key) - Unique packet identifier
  - `timestamp` (timestamptz) - Packet capture time
  - `source_ip` (text) - Source IP address
  - `dest_ip` (text) - Destination IP address
  - `source_port` (integer) - Source port number
  - `dest_port` (integer) - Destination port number
  - `protocol` (text) - Protocol type (TCP/UDP/ICMP)
  - `packet_size` (integer) - Size in bytes
  - `flags` (text) - TCP flags
  - `payload_size` (integer) - Payload size in bytes
  - `ttl` (integer) - Time to live
  - `created_at` (timestamptz) - Record creation time

  ### 2. `threat_detections`
  ML model predictions and threat classifications
  - `id` (uuid, primary key) - Unique detection identifier
  - `packet_id` (uuid, foreign key) - Reference to network packet
  - `threat_type` (text) - Type of threat detected
  - `confidence_score` (numeric) - ML model confidence (0-1)
  - `severity` (text) - Threat severity level
  - `is_malicious` (boolean) - Binary classification result
  - `features_vector` (jsonb) - Engineered features used
  - `model_version` (text) - ML model version used
  - `detected_at` (timestamptz) - Detection timestamp
  - `status` (text) - Alert status (new/investigating/resolved)

  ### 3. `incidents`
  Aggregated security incidents from multiple detections
  - `id` (uuid, primary key) - Unique incident identifier
  - `title` (text) - Incident title
  - `description` (text) - Detailed description
  - `severity` (text) - Overall severity
  - `status` (text) - Incident status
  - `affected_ips` (text array) - List of affected IP addresses
  - `detection_count` (integer) - Number of related detections
  - `assigned_to` (text) - SOC analyst assigned
  - `created_at` (timestamptz) - Incident creation time
  - `updated_at` (timestamptz) - Last update time
  - `resolved_at` (timestamptz, nullable) - Resolution time

  ### 4. `system_stats`
  Real-time system statistics and metrics
  - `id` (uuid, primary key) - Unique stat identifier
  - `timestamp` (timestamptz) - Measurement time
  - `total_packets` (integer) - Total packets processed
  - `threats_detected` (integer) - Threats found
  - `detection_rate` (numeric) - Detection rate percentage
  - `false_positive_rate` (numeric) - FP rate
  - `avg_confidence` (numeric) - Average confidence score
  - `top_threat_types` (jsonb) - Distribution of threat types

  ## Security
  - Enable RLS on all tables
  - Public read access for demo purposes (in production, this would be restricted)
  - Policies for authenticated access to management functions

  ## Indexes
  - Performance indexes on frequently queried columns
  - Time-series optimization for real-time monitoring
*/

-- Network packets table
CREATE TABLE IF NOT EXISTS network_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  source_ip text NOT NULL,
  dest_ip text NOT NULL,
  source_port integer NOT NULL,
  dest_port integer NOT NULL,
  protocol text NOT NULL,
  packet_size integer NOT NULL,
  flags text,
  payload_size integer DEFAULT 0,
  ttl integer DEFAULT 64,
  created_at timestamptz DEFAULT now()
);

-- Threat detections table
CREATE TABLE IF NOT EXISTS threat_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES network_packets(id) ON DELETE CASCADE,
  threat_type text NOT NULL,
  confidence_score numeric(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_malicious boolean DEFAULT false,
  features_vector jsonb,
  model_version text DEFAULT 'v1.0',
  detected_at timestamptz DEFAULT now(),
  status text DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive'))
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  affected_ips text[] DEFAULT '{}',
  detection_count integer DEFAULT 0,
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- System statistics table
CREATE TABLE IF NOT EXISTS system_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  total_packets integer DEFAULT 0,
  threats_detected integer DEFAULT 0,
  detection_rate numeric(5,2) DEFAULT 0,
  false_positive_rate numeric(5,2) DEFAULT 0,
  avg_confidence numeric(4,3) DEFAULT 0,
  top_threat_types jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packets_timestamp ON network_packets(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_packets_source_ip ON network_packets(source_ip);
CREATE INDEX IF NOT EXISTS idx_packets_dest_ip ON network_packets(dest_ip);
CREATE INDEX IF NOT EXISTS idx_detections_detected_at ON threat_detections(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_severity ON threat_detections(severity);
CREATE INDEX IF NOT EXISTS idx_detections_status ON threat_detections(status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON system_stats(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE network_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (demo mode)
CREATE POLICY "Allow public read access to packets"
  ON network_packets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to detections"
  ON threat_detections FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to incidents"
  ON incidents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to stats"
  ON system_stats FOR SELECT
  TO anon
  USING (true);

-- Insert policies for service role (backend operations)
CREATE POLICY "Allow service role to insert packets"
  ON network_packets FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert detections"
  ON threat_detections FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert incidents"
  ON incidents FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert stats"
  ON system_stats FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update policies for service role
CREATE POLICY "Allow service role to update incidents"
  ON incidents FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to update detections"
  ON threat_detections FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);