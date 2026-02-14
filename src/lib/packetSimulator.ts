interface SimulatedPacket {
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

export class PacketSimulator {
  private normalPorts = [80, 443, 22, 53, 25, 110, 143, 21];
  private maliciousPorts = [1337, 31337, 12345, 6667, 4444, 5555];
  private protocols = ['TCP', 'UDP', 'ICMP'];

  private generateIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private generatePort(isMalicious: boolean): number {
    if (isMalicious && Math.random() > 0.5) {
      return this.maliciousPorts[Math.floor(Math.random() * this.maliciousPorts.length)];
    }
    if (Math.random() > 0.3) {
      return this.normalPorts[Math.floor(Math.random() * this.normalPorts.length)];
    }
    return Math.floor(Math.random() * 65535);
  }

  generateNormalPacket(): SimulatedPacket {
    const protocol = this.protocols[Math.floor(Math.random() * 2)];
    const packetSize = 64 + Math.floor(Math.random() * 1000);

    return {
      source_ip: this.generateIP(),
      dest_ip: this.generateIP(),
      source_port: 49152 + Math.floor(Math.random() * 16383),
      dest_port: this.generatePort(false),
      protocol,
      packet_size: packetSize,
      flags: protocol === 'TCP' ? 'SYN,ACK' : undefined,
      payload_size: Math.floor(packetSize * 0.7),
      ttl: [64, 128, 255][Math.floor(Math.random() * 3)],
    };
  }

  generateMaliciousPacket(): SimulatedPacket {
    const attackType = Math.floor(Math.random() * 5);

    switch (attackType) {
      case 0:
        return {
          source_ip: this.generateIP(),
          dest_ip: this.generateIP(),
          source_port: Math.floor(Math.random() * 65535),
          dest_port: this.generatePort(true),
          protocol: 'TCP',
          packet_size: 40,
          flags: 'SYN',
          payload_size: 0,
          ttl: 64,
        };

      case 1:
        return {
          source_ip: this.generateIP(),
          dest_ip: this.generateIP(),
          source_port: Math.floor(Math.random() * 1024),
          dest_port: Math.floor(Math.random() * 1024),
          protocol: 'TCP',
          packet_size: 60,
          flags: 'SYN,FIN',
          payload_size: 0,
          ttl: 32,
        };

      case 2:
        return {
          source_ip: this.generateIP(),
          dest_ip: this.generateIP(),
          source_port: 49152 + Math.floor(Math.random() * 16383),
          dest_port: this.maliciousPorts[Math.floor(Math.random() * this.maliciousPorts.length)],
          protocol: 'TCP',
          packet_size: 1500,
          flags: 'PSH,ACK',
          payload_size: 1460,
          ttl: 128,
        };

      case 3:
        return {
          source_ip: this.generateIP(),
          dest_ip: this.generateIP(),
          source_port: Math.floor(Math.random() * 65535),
          dest_port: 80,
          protocol: 'TCP',
          packet_size: 20,
          flags: 'NULL',
          payload_size: 0,
          ttl: 255,
        };

      default:
        return {
          source_ip: this.generateIP(),
          dest_ip: this.generateIP(),
          source_port: 49152 + Math.floor(Math.random() * 16383),
          dest_port: 3389,
          protocol: 'TCP',
          packet_size: 1200,
          flags: 'FIN,URG,PSH',
          payload_size: 50,
          ttl: 45,
        };
    }
  }

  generatePacket(): SimulatedPacket {
    const isMalicious = Math.random() > 0.85;
    return isMalicious ? this.generateMaliciousPacket() : this.generateNormalPacket();
  }
}
