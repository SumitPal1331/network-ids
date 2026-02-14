import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PacketData {
  source_ip: string;
  dest_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  packet_size: number;
  flags?: string;
  payload_size: number;
  ttl: number;
}

interface FeatureVector {
  port_entropy: number;
  size_anomaly: number;
  protocol_score: number;
  flag_pattern: number;
  ttl_anomaly: number;
  known_malicious_port: boolean;
  payload_ratio: number;
}

class MLDetectionEngine {
  private readonly SUSPICIOUS_PORTS = [
    1337, 31337, 12345, 6667, 6666, 4444, 5555,
    27374, 27665, 20034, 9996, 1243, 6711, 6776,
  ];

  private readonly HIGH_RISK_PORTS = [
    23, 135, 139, 445, 3389, 1433, 3306, 5432,
  ];

  private readonly NORMAL_TTL_RANGE = [64, 128, 255];

  engineerFeatures(packet: PacketData): FeatureVector {
    const portEntropy = this.calculatePortEntropy(packet.source_port, packet.dest_port);
    const sizeAnomaly = this.calculateSizeAnomaly(packet.packet_size, packet.payload_size);
    const protocolScore = this.calculateProtocolScore(packet.protocol, packet.dest_port);
    const flagPattern = this.analyzeFlagPattern(packet.flags || "");
    const ttlAnomaly = this.calculateTTLAnomaly(packet.ttl);
    const knownMaliciousPort = this.checkMaliciousPort(packet.dest_port);
    const payloadRatio = packet.packet_size > 0 ? packet.payload_size / packet.packet_size : 0;

    return {
      port_entropy: portEntropy,
      size_anomaly: sizeAnomaly,
      protocol_score: protocolScore,
      flag_pattern: flagPattern,
      ttl_anomaly: ttlAnomaly,
      known_malicious_port: knownMaliciousPort,
      payload_ratio: payloadRatio,
    };
  }

  private calculatePortEntropy(srcPort: number, destPort: number): number {
    const isEphemeral = srcPort > 49152 && srcPort < 65535;
    const isWellKnown = destPort < 1024;

    if (isEphemeral && isWellKnown) return 0.2;
    if (destPort > 1024 && destPort < 49152) return 0.6;
    if (srcPort < 1024 && destPort < 1024) return 0.9;

    return 0.4;
  }

  private calculateSizeAnomaly(packetSize: number, payloadSize: number): number {
    if (packetSize < 64 || packetSize > 1500) return 0.8;
    if (payloadSize === 0 && packetSize > 64) return 0.7;
    if (packetSize > 1200) return 0.5;

    return 0.2;
  }

  private calculateProtocolScore(protocol: string, port: number): number {
    const normalProtocolPorts: Record<string, number[]> = {
      "TCP": [80, 443, 22, 21, 25, 110, 143],
      "UDP": [53, 67, 68, 123, 161, 162],
      "ICMP": [],
    };

    const expectedPorts = normalProtocolPorts[protocol] || [];
    if (expectedPorts.includes(port)) return 0.1;

    if (protocol === "ICMP" && Math.random() > 0.9) return 0.8;

    return 0.4;
  }

  private analyzeFlagPattern(flags: string): number {
    if (!flags) return 0.3;

    if (flags.includes("SYN") && flags.includes("FIN")) return 0.95;
    if (flags.includes("FIN") && flags.includes("URG") && flags.includes("PSH")) return 0.9;
    if (flags === "NULL") return 0.85;
    if (flags.includes("RST") && flags.includes("SYN")) return 0.8;

    const flagCount = flags.split(",").length;
    if (flagCount > 4) return 0.7;

    return 0.2;
  }

  private calculateTTLAnomaly(ttl: number): number {
    const closestNormal = this.NORMAL_TTL_RANGE.reduce((prev, curr) =>
      Math.abs(curr - ttl) < Math.abs(prev - ttl) ? curr : prev
    );

    const difference = Math.abs(closestNormal - ttl);

    if (difference > 30) return 0.9;
    if (difference > 15) return 0.6;
    if (difference > 5) return 0.3;

    return 0.1;
  }

  private checkMaliciousPort(port: number): boolean {
    return this.SUSPICIOUS_PORTS.includes(port);
  }

  classifyThreat(features: FeatureVector): {
    isMalicious: boolean;
    confidence: number;
    threatType: string;
    severity: string;
  } {
    let anomalyScore = 0;
    let weights = {
      port_entropy: 0.15,
      size_anomaly: 0.12,
      protocol_score: 0.18,
      flag_pattern: 0.25,
      ttl_anomaly: 0.10,
      known_malicious_port: 0.15,
      payload_ratio: 0.05,
    };

    anomalyScore += features.port_entropy * weights.port_entropy;
    anomalyScore += features.size_anomaly * weights.size_anomaly;
    anomalyScore += features.protocol_score * weights.protocol_score;
    anomalyScore += features.flag_pattern * weights.flag_pattern;
    anomalyScore += features.ttl_anomaly * weights.ttl_anomaly;
    anomalyScore += (features.known_malicious_port ? 1 : 0) * weights.known_malicious_port;
    anomalyScore += (1 - features.payload_ratio) * weights.payload_ratio;

    const isMalicious = anomalyScore > 0.45;
    const confidence = Math.min(0.99, Math.max(0.60, anomalyScore));

    let threatType = "Normal Traffic";
    let severity = "low";

    if (isMalicious) {
      if (features.flag_pattern > 0.8) {
        threatType = "TCP Scan Attack";
        severity = "high";
      } else if (features.known_malicious_port) {
        threatType = "Known Malicious Port";
        severity = "critical";
      } else if (features.protocol_score > 0.7) {
        threatType = "Protocol Anomaly";
        severity = "medium";
      } else if (features.size_anomaly > 0.7) {
        threatType = "DDoS Attempt";
        severity = "high";
      } else if (features.ttl_anomaly > 0.7) {
        threatType = "Spoofing Attempt";
        severity = "high";
      } else {
        threatType = "Anomalous Behavior";
        severity = "medium";
      }
    }

    return {
      isMalicious,
      confidence,
      threatType,
      severity,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { packet } = await req.json();

    if (!packet) {
      return new Response(
        JSON.stringify({ error: "Packet data required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: packetRecord, error: packetError } = await supabase
      .from("network_packets")
      .insert({
        source_ip: packet.source_ip,
        dest_ip: packet.dest_ip,
        source_port: packet.source_port,
        dest_port: packet.dest_port,
        protocol: packet.protocol,
        packet_size: packet.packet_size,
        flags: packet.flags,
        payload_size: packet.payload_size,
        ttl: packet.ttl,
      })
      .select()
      .single();

    if (packetError) throw packetError;

    const engine = new MLDetectionEngine();
    const features = engine.engineerFeatures(packet);
    const classification = engine.classifyThreat(features);

    const { data: detection, error: detectionError } = await supabase
      .from("threat_detections")
      .insert({
        packet_id: packetRecord.id,
        threat_type: classification.threatType,
        confidence_score: classification.confidence,
        severity: classification.severity,
        is_malicious: classification.isMalicious,
        features_vector: features,
        model_version: "v1.0-ensemble",
      })
      .select()
      .single();

    if (detectionError) throw detectionError;

    return new Response(
      JSON.stringify({
        success: true,
        packet_id: packetRecord.id,
        detection_id: detection.id,
        result: classification,
        features,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing packet:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
