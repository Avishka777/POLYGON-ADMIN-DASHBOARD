const net = require("net");
const http = require("http");
const os = require("os");

class BackendScaleSimulator {
  constructor() {
    this.tcpServer = null;
    this.httpServer = null;
    this.clients = new Set();
    this.timer = null;
    this.isRunning = false;
    this.tcpPort = 33581;
    this.httpPort = 3001;
    this.config = {
      mode: "random",
      currentWeight: 6.5,
      minWeight: 1.0,
      maxWeight: 25.0,
      intervalMs: 1000,
      isStable: true,
      jitter: false
    };
    this.logs = [];
  }

  getLocalIps() {
    const ifaces = os.networkInterfaces();
    const list = [];
    for (const [name, arr] of Object.entries(ifaces)) {
      if (!arr) continue;
      for (const iface of arr) {
        if (iface.family === "IPv4" && !iface.internal) {
          list.push({ name, ip: iface.address });
        }
      }
    }
    return list;
  }

  getPrimaryIp() {
    const ips = this.getLocalIps();
    const wifi = ips.find((i) => /wi-?fi|wlan/i.test(i.name));
    if (wifi) return wifi.ip;
    const eth = ips.find((i) => /eth|ethernet|local/i.test(i.name));
    if (eth) return eth.ip;
    return ips[0]?.ip || "127.0.0.1";
  }

  addLog(message, type = "system") {
    const entry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
  }

  createBudryPacket(weight) {
    const formatted = weight.toFixed(1);
    return `XD1\tSDT\r\nSDT\t1\t1\t0\t0\t0\t0,0\t0,0\t0,0\t0,0\t${formatted}kg\t0.0kg\r\nEND\tSDT\r\n`;
  }

  broadcastWeight() {
    if (!this.isRunning) return;

    if (this.config.mode === "random") {
      const min = this.config.minWeight;
      const max = this.config.maxWeight;
      this.config.currentWeight = Math.round((Math.random() * (max - min) + min) * 10) / 10;
    } else if (this.config.jitter) {
      const delta = (Math.random() - 0.5) * 0.1;
      this.config.currentWeight = Math.max(0, Math.round((this.config.currentWeight + delta) * 10) / 10);
    }

    const packet = this.createBudryPacket(this.config.currentWeight);

    for (const socket of Array.from(this.clients)) {
      try {
        if (!socket.destroyed && socket.writable) {
          socket.write(packet);
        }
      } catch (_) {
        this.clients.delete(socket);
      }
    }
  }

  start(tcpPort = 33581, httpPort = 3001) {
    if (this.isRunning) {
      return Promise.resolve({
        success: true,
        message: `Scale Simulator already running on TCP:${this.tcpPort}, HTTP:${this.httpPort}`
      });
    }

    return new Promise((resolve) => {
      try {
        this.tcpPort = tcpPort;
        this.httpPort = httpPort;

        // 1. TCP Server for BUDRY MFD-300 socket
        const tcp = net.createServer((socket) => {
          const addr = `${socket.remoteAddress}:${socket.remotePort}`;
          this.clients.add(socket);
          this.addLog(`Codi Net app connected via TCP from ${addr}`, "tcp");

          socket.write(this.createBudryPacket(this.config.currentWeight));

          socket.on("error", (err) => {
            this.addLog(`TCP socket error: ${err.message}`, "tcp");
            this.clients.delete(socket);
          });

          socket.on("close", () => {
            this.addLog(`Codi Net client ${addr} disconnected`, "tcp");
            this.clients.delete(socket);
          });
        });

        // 2. HTTP Server for Expo Go bridge
        const httpServer = http.createServer((req, res) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "*");
          res.setHeader("Content-Type", "application/json");

          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }

          if (req.url === "/api/weight" || req.url === "/") {
            this.addLog(`HTTP GET /api/weight -> ${this.config.currentWeight} kg`, "http");
            res.writeHead(200);
            res.end(JSON.stringify({
              weight: this.config.currentWeight,
              unit: "kg",
              connected: true,
              stale: false
            }));
            return;
          }

          res.writeHead(404);
          res.end(JSON.stringify({ error: "Endpoint not found" }));
        });

        tcp.listen(tcpPort, "0.0.0.0", () => {
          this.addLog(`BUDRY Scale TCP Server listening on 0.0.0.0:${tcpPort}`, "system");
        });

        httpServer.listen(httpPort, "0.0.0.0", () => {
          this.addLog(`Scale HTTP Bridge listening on 0.0.0.0:${httpPort}`, "system");
        });

        this.tcpServer = tcp;
        this.httpServer = httpServer;
        this.isRunning = true;

        this.timer = setInterval(() => {
          this.broadcastWeight();
        }, this.config.intervalMs || 1000);

        const ip = this.getPrimaryIp();
        resolve({
          success: true,
          message: `Scale Simulator started on ${ip}:${tcpPort} (HTTP Bridge: ${httpPort})`
        });
      } catch (err) {
        resolve({ success: false, message: err.message });
      }
    });
  }

  stop() {
    if (!this.isRunning) {
      return Promise.resolve({ success: true, message: "Scale simulator already stopped." });
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    for (const socket of Array.from(this.clients)) {
      try { socket.destroy(); } catch (_) {}
    }
    this.clients.clear();

    if (this.tcpServer) {
      try { this.tcpServer.close(); } catch (_) {}
      this.tcpServer = null;
    }

    if (this.httpServer) {
      try { this.httpServer.close(); } catch (_) {}
      this.httpServer = null;
    }

    this.isRunning = false;
    this.addLog("Scale simulator stopped.", "system");
    return Promise.resolve({ success: true, message: "Scale simulator stopped." });
  }

  updateConfig(partial) {
    this.config = { ...this.config, ...partial };
    if (partial.intervalMs && this.isRunning) {
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.broadcastWeight(), this.config.intervalMs);
    }
    if (partial.currentWeight !== undefined && this.isRunning) {
      this.broadcastWeight();
    }
    return this.config;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      ip: this.getPrimaryIp(),
      allIps: this.getLocalIps(),
      tcpPort: this.tcpPort,
      httpPort: this.httpPort,
      connectedClientsCount: this.clients.size,
      config: { ...this.config },
      logs: [...this.logs]
    };
  }
}

module.exports = new BackendScaleSimulator();
