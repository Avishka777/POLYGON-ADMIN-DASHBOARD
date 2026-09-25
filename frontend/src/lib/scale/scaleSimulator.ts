import net from 'net';
import http from 'http';
import os from 'os';

export interface ScaleConfig {
  mode: 'random' | 'manual';
  currentWeight: number;
  minWeight: number;
  maxWeight: number;
  intervalMs: number;
  isStable: boolean;
  jitter: boolean;
}

export interface ScaleLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'tcp' | 'http' | 'system';
}

export interface ScaleServerState {
  isRunning: boolean;
  ip: string;
  allIps: { name: string; ip: string }[];
  tcpPort: number;
  httpPort: number;
  connectedClientsCount: number;
  config: ScaleConfig;
  logs: ScaleLogEntry[];
}

interface ScaleServerInstance {
  tcpServer: net.Server | null;
  httpServer: http.Server | null;
  clients: Set<net.Socket>;
  timer: NodeJS.Timeout | null;
  config: ScaleConfig;
  logs: ScaleLogEntry[];
  isRunning: boolean;
  tcpPort: number;
  httpPort: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __scaleSimulatorInstance: ScaleServerInstance | undefined;
}

function getLocalIpAddresses(): { name: string; ip: string }[] {
  const ifaces = os.networkInterfaces();
  const list: { name: string; ip: string }[] = [];
  for (const [name, arr] of Object.entries(ifaces)) {
    if (!arr) continue;
    for (const iface of arr) {
      if (iface.family === 'IPv4' && !iface.internal) {
        list.push({ name, ip: iface.address });
      }
    }
  }
  return list;
}

function getPrimaryLocalIp(): string {
  const ips = getLocalIpAddresses();
  // Prefer Wi-Fi or Ethernet
  const wifi = ips.find((i) => /wi-?fi|wlan/i.test(i.name));
  if (wifi) return wifi.ip;
  const eth = ips.find((i) => /eth|ethernet|local/i.test(i.name));
  if (eth) return eth.ip;
  return ips[0]?.ip || '127.0.0.1';
}

function getOrCreateInstance(): ScaleServerInstance {
  if (!globalThis.__scaleSimulatorInstance) {
    globalThis.__scaleSimulatorInstance = {
      tcpServer: null,
      httpServer: null,
      clients: new Set(),
      timer: null,
      config: {
        mode: 'random',
        currentWeight: 6.5,
        minWeight: 1.0,
        maxWeight: 25.0,
        intervalMs: 1000,
        isStable: true,
        jitter: false,
      },
      logs: [],
      isRunning: false,
      tcpPort: 33581,
      httpPort: 3001,
    };
  }
  return globalThis.__scaleSimulatorInstance;
}

function addLog(inst: ScaleServerInstance, message: string, type: 'tcp' | 'http' | 'system') {
  const entry: ScaleLogEntry = {
    id: `${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    message,
    type,
  };
  inst.logs.unshift(entry);
  if (inst.logs.length > 50) {
    inst.logs.pop();
  }
}

/**
 * Format BUDRY MFD-300 Raw TCP packet format as parsed by Codi Net:
 * XD1\tSDT\r\nSDT\t1\t1\t0\t0\t0\t0,0\t0,0\t0,0\t0,0\t8.3kg\t0.0kg\r\nEND\tSDT\r\n
 */
function createBudryPacket(weight: number): string {
  const formattedWeight = weight.toFixed(1);
  return `XD1\tSDT\r\nSDT\t1\t1\t0\t0\t0\t0,0\t0,0\t0,0\t0,0\t${formattedWeight}kg\t0.0kg\r\nEND\tSDT\r\n`;
}

function broadcastWeight(inst: ScaleServerInstance) {
  if (!inst.isRunning) return;

  // Update weight if in random mode
  if (inst.config.mode === 'random') {
    const min = inst.config.minWeight;
    const max = inst.config.maxWeight;
    // Generate new random weight between min and max rounded to 1 decimal
    const rand = Math.round((Math.random() * (max - min) + min) * 10) / 10;
    inst.config.currentWeight = rand;
  } else if (inst.config.jitter) {
    // Add tiny fluctuation (±0.05kg) in manual mode if jitter enabled
    const delta = (Math.random() - 0.5) * 0.1;
    inst.config.currentWeight = Math.max(0, Math.round((inst.config.currentWeight + delta) * 10) / 10);
  }

  const packet = createBudryPacket(inst.config.currentWeight);

  // Send packet to all connected TCP clients
  if (inst.clients.size > 0) {
    for (const socket of Array.from(inst.clients)) {
      try {
        if (!socket.destroyed && socket.writable) {
          socket.write(packet);
        }
      } catch (err: any) {
        inst.clients.delete(socket);
      }
    }
  }
}

export function startScaleServer(
  tcpPort = 33581,
  httpPort = 3001
): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();

  if (inst.isRunning) {
    return Promise.resolve({
      success: true,
      message: `Scale simulator is already running on TCP:${inst.tcpPort}, HTTP:${inst.httpPort}`,
    });
  }

  return new Promise((resolve) => {
    try {
      inst.tcpPort = tcpPort;
      inst.httpPort = httpPort;

      // 1. Create TCP Server for BUDRY MFD-300 socket
      const tcp = net.createServer((socket) => {
        const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
        inst.clients.add(socket);
        addLog(inst, `Codi Net app connected via TCP from ${clientAddr}`, 'tcp');

        // Immediately send initial weight packet
        socket.write(createBudryPacket(inst.config.currentWeight));

        socket.on('error', (err) => {
          addLog(inst, `Socket error from ${clientAddr}: ${err.message}`, 'tcp');
          inst.clients.delete(socket);
        });

        socket.on('close', () => {
          addLog(inst, `Codi Net client ${clientAddr} disconnected`, 'tcp');
          inst.clients.delete(socket);
        });
      });

      // 2. Create HTTP Server for Expo Go bridge (/api/weight)
      const httpServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
        }

        if (req.url === '/api/weight' || req.url === '/') {
          addLog(inst, `HTTP GET /api/weight - responded with ${inst.config.currentWeight} kg`, 'http');
          res.writeHead(200);
          res.end(
            JSON.stringify({
              weight: inst.config.currentWeight,
              unit: 'kg',
              connected: true,
              stale: false,
            })
          );
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });

      tcp.on('error', (err: any) => {
        addLog(inst, `TCP Server error: ${err.message}`, 'system');
      });

      httpServer.on('error', (err: any) => {
        addLog(inst, `HTTP Bridge Server error: ${err.message}`, 'system');
      });

      // Start listening on all network interfaces (0.0.0.0)
      tcp.listen(tcpPort, '0.0.0.0', () => {
        addLog(inst, `BUDRY Scale TCP Server listening on 0.0.0.0:${tcpPort}`, 'system');
      });

      httpServer.listen(httpPort, '0.0.0.0', () => {
        addLog(inst, `Scale HTTP Bridge Server listening on 0.0.0.0:${httpPort}`, 'system');
      });

      inst.tcpServer = tcp;
      inst.httpServer = httpServer;
      inst.isRunning = true;

      // Start weight broadcast loop
      inst.timer = setInterval(() => {
        broadcastWeight(inst);
      }, inst.config.intervalMs || 1000);

      const localIp = getPrimaryLocalIp();
      addLog(inst, `Scale Simulator running! Use IP: ${localIp}, TCP: ${tcpPort} (or HTTP: ${httpPort})`, 'system');

      resolve({
        success: true,
        message: `Scale Simulator started on ${localIp}:${tcpPort} (HTTP Bridge: ${httpPort})`,
      });
    } catch (err: any) {
      resolve({
        success: false,
        message: `Failed to start scale simulator: ${err.message}`,
      });
    }
  });
}

export function stopScaleServer(): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();

  if (!inst.isRunning) {
    return Promise.resolve({
      success: true,
      message: 'Scale simulator is already stopped.',
    });
  }

  return new Promise((resolve) => {
    try {
      if (inst.timer) {
        clearInterval(inst.timer);
        inst.timer = null;
      }

      // Close all client sockets
      for (const socket of Array.from(inst.clients)) {
        try {
          socket.destroy();
        } catch (_) {}
      }
      inst.clients.clear();

      if (inst.tcpServer) {
        try {
          inst.tcpServer.close();
        } catch (_) {}
        inst.tcpServer = null;
      }

      if (inst.httpServer) {
        try {
          inst.httpServer.close();
        } catch (_) {}
        inst.httpServer = null;
      }

      inst.isRunning = false;
      addLog(inst, 'Scale simulator server stopped.', 'system');

      resolve({
        success: true,
        message: 'Scale simulator stopped successfully.',
      });
    } catch (err: any) {
      resolve({
        success: false,
        message: `Error stopping scale simulator: ${err.message}`,
      });
    }
  });
}

export function updateScaleConfig(partial: Partial<ScaleConfig>): ScaleConfig {
  const inst = getOrCreateInstance();
  inst.config = { ...inst.config, ...partial };

  // If interval changed and running, restart timer
  if (partial.intervalMs && inst.isRunning) {
    if (inst.timer) clearInterval(inst.timer);
    inst.timer = setInterval(() => {
      broadcastWeight(inst);
    }, inst.config.intervalMs);
  }

  // If manual weight changed, broadcast immediately
  if (partial.currentWeight !== undefined && inst.isRunning) {
    broadcastWeight(inst);
  }

  return inst.config;
}

export function getScaleServerStatus(): ScaleServerState {
  const inst = getOrCreateInstance();
  return {
    isRunning: inst.isRunning,
    ip: getPrimaryLocalIp(),
    allIps: getLocalIpAddresses(),
    tcpPort: inst.tcpPort,
    httpPort: inst.httpPort,
    connectedClientsCount: inst.clients.size,
    config: { ...inst.config },
    logs: [...inst.logs],
  };
}
