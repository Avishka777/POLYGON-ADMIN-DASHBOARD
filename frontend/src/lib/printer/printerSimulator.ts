import net from 'net';
import http from 'http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export interface PrinterLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'tcp' | 'http' | 'system';
}

export interface ParsedTsplLabel {
  orderNumber: string;
  category: string;
  orderType: string;
  date: string;
  timeSlot: string;
  stepIndex: string;
  stepLabel: string;
  qrValue: string;
  barcodeValue?: string;
  widthMm: number;
  heightMm: number;
  rawTspl: string;
  timestamp: string;
  source: 'tcp' | 'http' | 'bluetooth' | 'manual';
  allTexts: Array<{ x: number; y: number; font: string; content: string }>;
  lines: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface PrintJobRecord {
  id: string;
  timestamp: string;
  source: 'tcp' | 'http' | 'bluetooth' | 'manual';
  rawTspl: string;
  parsed: ParsedTsplLabel;
  status: 'printed' | 'failed';
}

export interface PrinterResponseProfile {
  tsplStatusByte: number;
  escPosStatusByte: number;
  ackByte: number;
  lastCapturedFromRealPrinter: {
    hex: string;
    description: string;
    timestamp: string;
    source: string;
  } | null;
}

export interface PrinterServerState {
  isRunning: boolean;
  isBluetoothRunning: boolean;
  bluetoothDeviceName: string;
  ip: string;
  allIps: { name: string; ip: string }[];
  tcpPort: number;
  httpPort: number;
  connectedClientsCount: number;
  totalJobsPrinted: number;
  latestJob: PrintJobRecord | null;
  history: PrintJobRecord[];
  logs: PrinterLogEntry[];
  responseProfile: PrinterResponseProfile;
}

interface PrinterServerInstance {
  tcpServer: net.Server | null;
  httpServer: http.Server | null;
  bluetoothProcess: ChildProcess | null;
  isBluetoothRunning: boolean;
  bluetoothDeviceName: string;
  clients: Set<net.Socket>;
  logs: PrinterLogEntry[];
  history: PrintJobRecord[];
  latestJob: PrintJobRecord | null;
  totalJobsPrinted: number;
  isRunning: boolean;
  tcpPort: number;
  httpPort: number;
  responseProfile: PrinterResponseProfile;
}

declare global {
  // eslint-disable-next-line no-var
  var __printerSimulatorInstance: PrinterServerInstance | undefined;
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
  const wifi = ips.find((i) => /wi-?fi|wlan/i.test(i.name));
  if (wifi) return wifi.ip;
  const eth = ips.find((i) => /eth|ethernet|local/i.test(i.name));
  if (eth) return eth.ip;
  return ips[0]?.ip || '127.0.0.1';
}

function getOrCreateInstance(): PrinterServerInstance {
  if (!globalThis.__printerSimulatorInstance) {
    globalThis.__printerSimulatorInstance = {
      tcpServer: null,
      httpServer: null,
      bluetoothProcess: null,
      isBluetoothRunning: false,
      bluetoothDeviceName: "Napru Hashini Printer",
      clients: new Set(),
      logs: [],
      history: [],
      latestJob: null,
      totalJobsPrinted: 0,
      isRunning: false,
      tcpPort: 33582,
      httpPort: 3002,
      responseProfile: {
        tsplStatusByte: 0x00,
        escPosStatusByte: 0x12,
        ackByte: 0x00,
        lastCapturedFromRealPrinter: {
          hex: '0x00',
          description: 'Printer Normal / Ready (Head closed, paper present, idle)',
          timestamp: new Date().toLocaleTimeString(),
          source: 'XP-365B Physical Baseline',
        },
      },
    };
  }
  return globalThis.__printerSimulatorInstance;
}

function addLog(inst: PrinterServerInstance, message: string, type: 'tcp' | 'http' | 'system') {
  const entry: PrinterLogEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
 * Parses TSPL command stream from Codi Net Packing or any standard TSPL printer.
 */
export function parseTsplCommands(
  raw: string,
  source: 'tcp' | 'http' | 'bluetooth' | 'manual' = 'manual'
): ParsedTsplLabel {
  const lines = raw.split(/\r?\n/);
  let widthMm = 50;
  let heightMm = 30;
  let qrValue = '';
  let barcodeValue = '';
  const allTexts: Array<{ x: number; y: number; font: string; content: string }> = [];
  const barLines: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sizeMatch = trimmed.match(/^SIZE\s+(\d+(?:\.\d+)?)\s*mm\s*,\s*(\d+(?:\.\d+)?)\s*mm/i);
    if (sizeMatch) {
      widthMm = parseFloat(sizeMatch[1]);
      heightMm = parseFloat(sizeMatch[2]);
      continue;
    }

    const textMatch = trimmed.match(
      /^TEXT\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"((?:\\"|[^"])*)"/i
    );
    if (textMatch) {
      const x = parseInt(textMatch[1], 10);
      const y = parseInt(textMatch[2], 10);
      const font = textMatch[3];
      const content = textMatch[7].replace(/\\"/g, '"');
      allTexts.push({ x, y, font, content });
      continue;
    }

    const qrMatch = trimmed.match(
      /^QRCODE\s+(\d+)\s*,\s*(\d+)\s*,\s*([A-Za-z])\s*,\s*(\d+)\s*,\s*([A-Za-z])\s*,\s*(\d+)\s*,\s*"((?:\\"|[^"])*)"/i
    );
    if (qrMatch) {
      qrValue = qrMatch[7].replace(/\\"/g, '"');
      continue;
    }

    const barMatch = trimmed.match(
      /^BARCODE\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"((?:\\"|[^"])*)"/i
    );
    if (barMatch) {
      barcodeValue = barMatch[9].replace(/\\"/g, '"');
      continue;
    }

    const barLineMatch = trimmed.match(/^BAR\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (barLineMatch) {
      barLines.push({
        x: parseInt(barLineMatch[1], 10),
        y: parseInt(barLineMatch[2], 10),
        width: parseInt(barLineMatch[3], 10),
        height: parseInt(barLineMatch[4], 10),
      });
      continue;
    }
  }

  let orderNumber = '';
  let category = '';
  let orderType = '';
  let date = '';
  let timeSlot = '';
  let stepIndex = '';
  let stepLabel = '';

  const sorted = [...allTexts].sort((a, b) => a.y - b.y);

  for (const item of sorted) {
    const text = item.content.trim();
    if (!text) continue;

    if (item.font === '3' || (!orderNumber && /^ORD|INV|#|\d{4,}/i.test(text))) {
      if (!orderNumber) {
        orderNumber = text;
        continue;
      }
    }

    if (/^Step\s*\d+\s*\/\s*\d+/i.test(text) || /^Box\s*\d+\s*\/\s*\d+/i.test(text)) {
      stepIndex = text;
      continue;
    }

    if (/wholesale|retail|standard|express/i.test(text) && !orderType) {
      orderType = text;
      continue;
    }

    if (/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(text) || /\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(text)) {
      if (!date) {
        date = text;
        continue;
      }
    }

    if (/\d{1,2}:\d{2}/.test(text) || /morning|evening|afternoon|slot/i.test(text)) {
      if (!timeSlot) {
        timeSlot = text;
        continue;
      }
    }

    if (item.y > 180 || item.y >= 200) {
      stepLabel = text;
      continue;
    }

    if (!category && item.y < 100 && item.font !== '3') {
      category = text;
      continue;
    }
  }

  if (!orderNumber && sorted.length > 0) orderNumber = sorted[0].content;
  if (!category && sorted.length > 1) category = sorted[1].content;
  if (!orderType && sorted.length > 2) orderType = sorted[2].content;
  if (!date && sorted.length > 3) date = sorted[3].content;
  if (!timeSlot && sorted.length > 4) timeSlot = sorted[4].content;
  if (!stepIndex && sorted.length > 5) stepIndex = sorted[5].content;
  if (!stepLabel && sorted.length > 6) stepLabel = sorted[sorted.length - 1].content;

  if (!qrValue && orderNumber) {
    qrValue = orderNumber;
  }

  return {
    orderNumber: orderNumber || 'ORD-VIRTUAL-001',
    category: category || 'Moragahahena Hub',
    orderType: orderType || 'Wholesale',
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '09:00 AM - 12:00 PM',
    stepIndex: stepIndex || 'Step 1/1',
    stepLabel: stepLabel || 'Main Container',
    qrValue: qrValue || orderNumber || '12345678',
    barcodeValue: barcodeValue || undefined,
    widthMm,
    heightMm,
    rawTspl: raw,
    timestamp: new Date().toLocaleTimeString(),
    source,
    allTexts,
    lines: barLines,
  };
}

/**
 * Handles incoming TSPL command, creates job, adds to history and logs.
 */
export function processPrintJob(
  rawTspl: string,
  source: 'tcp' | 'http' | 'bluetooth' | 'manual' = 'manual'
): PrintJobRecord {
  const inst = getOrCreateInstance();
  const parsed = parseTsplCommands(rawTspl, source);

  const job: PrintJobRecord = {
    id: `JOB_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    source,
    rawTspl,
    parsed,
    status: 'printed',
  };

  inst.latestJob = job;
  inst.totalJobsPrinted += 1;
  inst.history.unshift(job);
  if (inst.history.length > 30) {
    inst.history.pop();
  }

  addLog(
    inst,
    `Printed sticker: ${parsed.orderNumber} (${parsed.stepIndex} - ${parsed.stepLabel}) via ${source.toUpperCase()}`,
    source === 'manual' ? 'system' : (source === 'bluetooth' ? 'system' : source)
  );

  return job;
}

/**
 * Starts the native Windows 10 Bluetooth LE GATT Printer peripheral daemon
 */
export function startBluetoothPrinter(dashboardPort = 3000): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();

  if (inst.isBluetoothRunning && inst.bluetoothProcess) {
    return Promise.resolve({
      success: true,
      message: `Bluetooth Printer is already broadcasting as '${inst.bluetoothDeviceName}'`,
    });
  }

  return new Promise((resolve) => {
    try {
      const candidates = [
        path.resolve(process.cwd(), '..', 'tools', 'bluetooth-printer', 'BluetoothPrinterBridge.exe'),
        path.resolve(process.cwd(), 'tools', 'bluetooth-printer', 'BluetoothPrinterBridge.exe'),
        'D:\\Polygon\\Mobile\\All Apps\\POLYGON-ADMIN-DASHBOARD\\tools\\bluetooth-printer\\BluetoothPrinterBridge.exe',
      ];

      const exePath = candidates.find((p) => fs.existsSync(p));
      if (!exePath) {
        const msg = 'BluetoothPrinterBridge.exe binary not found. Build with csc.exe.';
        addLog(inst, msg, 'system');
        resolve({ success: false, message: msg });
        return;
      }

      addLog(inst, `Launching Native Bluetooth Peripheral daemon: ${exePath}`, 'system');

      const proc = spawn(exePath, [dashboardPort.toString()], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      proc.stdout?.on('data', (data) => {
        const lines = data.toString('utf8').split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            addLog(inst, `[BT] ${line.trim()}`, 'system');
          }
        }
      });

      proc.stderr?.on('data', (data) => {
        const text = data.toString('utf8').trim();
        if (text) addLog(inst, `[BT STDERR] ${text}`, 'system');
      });

      proc.on('close', (code) => {
        inst.isBluetoothRunning = false;
        inst.bluetoothProcess = null;
        addLog(inst, `Bluetooth peripheral daemon closed (code: ${code})`, 'system');
      });

      inst.bluetoothProcess = proc;
      inst.isBluetoothRunning = true;

      addLog(
        inst,
        `Bluetooth Printer ACTIVE! Laptop is broadcasting as '${inst.bluetoothDeviceName}' (Service: 49535343-fe7d-4ae5-8fa9-9fafd205e455)`,
        'system'
      );

      resolve({
        success: true,
        message: `Bluetooth Printer active and broadcasting as '${inst.bluetoothDeviceName}'`,
      });
    } catch (err: any) {
      addLog(inst, `Failed to launch Bluetooth Printer daemon: ${err.message}`, 'system');
      resolve({ success: false, message: err.message });
    }
  });
}

/**
 * Stops the native Windows 10 Bluetooth LE GATT Printer peripheral daemon
 */
export function stopBluetoothPrinter(): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();
  if (inst.bluetoothProcess) {
    try {
      inst.bluetoothProcess.kill();
    } catch (_) {}
    inst.bluetoothProcess = null;
  }
  inst.isBluetoothRunning = false;
  addLog(inst, 'Bluetooth Printer broadcast stopped', 'system');
  return Promise.resolve({ success: true, message: 'Bluetooth Printer stopped' });
}

export function startPrinterServer(
  tcpPort = 33582,
  httpPort = 3002
): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();

  // Always ensure Bluetooth printer is running when printer server starts
  startBluetoothPrinter(3000).catch(() => {});

  if (inst.isRunning) {
    return Promise.resolve({
      success: true,
      message: `Virtual Printer is already running on TCP:${inst.tcpPort}, HTTP:${inst.httpPort}`,
    });
  }

  return new Promise((resolve) => {
    try {
      inst.tcpPort = tcpPort;
      inst.httpPort = httpPort;

      // 1. TCP Raw Socket Server
      const tcp = net.createServer((socket) => {
        const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
        inst.clients.add(socket);
        addLog(inst, `Printer TCP client connected from ${clientAddr}`, 'tcp');

        let buffer = '';

        socket.on('data', (chunk: Buffer) => {
          // 1. Detect binary real-time printer status inquiry commands before string conversion
          const isTsplStatusQuery =
            (chunk.length === 2 && chunk[0] === 0x7e && chunk[1] === 0x40) ||
            (chunk.length === 3 && chunk[0] === 0x7e && chunk[1] === 0x21 && chunk[2] === 0x40);

          const isEscPosStatusQuery =
            chunk.length >= 3 && chunk[0] === 0x10 && chunk[1] === 0x04;

          if (isTsplStatusQuery) {
            const resp = Buffer.from([inst.responseProfile.tsplStatusByte]);
            socket.write(resp);
            addLog(
              inst,
              `[TCP STATUS QUERY] Returned real TSPL status (0x${inst.responseProfile.tsplStatusByte.toString(16).padStart(2, '0')}) to ${clientAddr}`,
              'tcp'
            );
            return;
          }

          if (isEscPosStatusQuery) {
            const resp = Buffer.from([inst.responseProfile.escPosStatusByte]);
            socket.write(resp);
            addLog(
              inst,
              `[TCP STATUS QUERY] Returned real ESC/POS status (0x${inst.responseProfile.escPosStatusByte.toString(16).padStart(2, '0')}) to ${clientAddr}`,
              'tcp'
            );
            return;
          }

          buffer += chunk.toString('utf8');

          if (/PRINT\s+\d+,\d+/i.test(buffer)) {
            processPrintJob(buffer, 'tcp');
            buffer = '';
            // Send exact real printer ACK response back to mobile driver
            socket.write(Buffer.from([inst.responseProfile.tsplStatusByte]));
            addLog(
              inst,
              `[TCP PRINT ACK] Sent completion ACK (0x${inst.responseProfile.tsplStatusByte.toString(16).padStart(2, '0')}) to ${clientAddr}`,
              'tcp'
            );
          }
        });

        socket.on('error', (err) => {
          addLog(inst, `Printer socket error from ${clientAddr}: ${err.message}`, 'tcp');
          inst.clients.delete(socket);
        });

        socket.on('close', () => {
          if (buffer.trim()) {
            processPrintJob(buffer, 'tcp');
            buffer = '';
          }
          addLog(inst, `Printer client ${clientAddr} disconnected`, 'tcp');
          inst.clients.delete(socket);
        });
      });

      // 2. HTTP Bridge Server (Port 3002)
      const httpServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'GET' && (req.url === '/status' || req.url === '/api/printer/status')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(getPrinterServerStatus()));
          return;
        }

        if (req.method === 'POST' && (req.url === '/print' || req.url === '/api/printer/print' || req.url === '/')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              let tspl = body;
              let source: 'http' | 'bluetooth' | 'manual' = 'http';
              if (body.trim().startsWith('{')) {
                const json = JSON.parse(body);
                tspl = json.tspl || json.command || json.data || '';
                if (json.source === 'bluetooth') source = 'bluetooth';
              }

              if (!tspl.trim()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'No TSPL command provided' }));
                return;
              }

              const job = processPrintJob(tspl, source);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, job }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });

      tcp.on('error', (err: any) => {
        addLog(inst, `TCP Server error: ${err.message}`, 'system');
      });

      httpServer.on('error', (err: any) => {
        addLog(inst, `HTTP Bridge Server error: ${err.message}`, 'system');
      });

      tcp.listen(tcpPort, '0.0.0.0', () => {
        addLog(inst, `Virtual TSPL Printer TCP Server listening on 0.0.0.0:${tcpPort}`, 'system');
      });

      httpServer.listen(httpPort, '0.0.0.0', () => {
        addLog(inst, `Virtual TSPL Printer HTTP Bridge listening on 0.0.0.0:${httpPort}`, 'system');
      });

      inst.tcpServer = tcp;
      inst.httpServer = httpServer;
      inst.isRunning = true;

      const localIp = getPrimaryLocalIp();
      addLog(
        inst,
        `Virtual Printer Hub Ready! Bluetooth: '${inst.bluetoothDeviceName}', IP: ${localIp}, TCP: ${tcpPort}`,
        'system'
      );

      if (!inst.latestJob) {
        processPrintJob(generateSampleTspl('wholesale'), 'manual');
      }

      resolve({
        success: true,
        message: `Virtual Thermal Printer started. Bluetooth: '${inst.bluetoothDeviceName}', TCP: ${tcpPort}, HTTP: ${httpPort}`,
      });
    } catch (err: any) {
      resolve({
        success: false,
        message: `Failed to start Virtual Printer: ${err.message}`,
      });
    }
  });
}

export function stopPrinterServer(): Promise<{ success: boolean; message: string }> {
  const inst = getOrCreateInstance();

  stopBluetoothPrinter().catch(() => {});

  if (!inst.isRunning) {
    return Promise.resolve({
      success: true,
      message: 'Virtual Printer is not running',
    });
  }

  return new Promise((resolve) => {
    for (const socket of Array.from(inst.clients)) {
      try {
        socket.destroy();
      } catch (_) {}
    }
    inst.clients.clear();

    if (inst.tcpServer) {
      inst.tcpServer.close();
      inst.tcpServer = null;
    }

    if (inst.httpServer) {
      inst.httpServer.close();
      inst.httpServer = null;
    }

    inst.isRunning = false;
    addLog(inst, 'Virtual Printer Hub servers stopped', 'system');

    resolve({
      success: true,
      message: 'Virtual Printer stopped successfully',
    });
  });
}

export function getPrinterServerStatus(): PrinterServerState {
  const inst = getOrCreateInstance();
  return {
    isRunning: inst.isRunning,
    isBluetoothRunning: inst.isBluetoothRunning,
    bluetoothDeviceName: inst.bluetoothDeviceName,
    ip: getPrimaryLocalIp(),
    allIps: getLocalIpAddresses(),
    tcpPort: inst.tcpPort,
    httpPort: inst.httpPort,
    connectedClientsCount: inst.clients.size,
    totalJobsPrinted: inst.totalJobsPrinted,
    latestJob: inst.latestJob,
    history: inst.history,
    logs: inst.logs,
    responseProfile: getPrinterResponseProfile(),
  };
}

export function getPrinterResponseProfile(): PrinterResponseProfile {
  const inst = getOrCreateInstance();
  if (!inst.responseProfile) {
    inst.responseProfile = {
      tsplStatusByte: 0x00,
      escPosStatusByte: 0x12,
      ackByte: 0x00,
      lastCapturedFromRealPrinter: {
        hex: '0x00',
        description: 'Printer Normal / Ready (Head closed, paper present, idle)',
        timestamp: new Date().toLocaleTimeString(),
        source: 'XP-365B Physical Baseline',
      },
    };
  }
  return inst.responseProfile;
}

export function updatePrinterResponseProfile(
  profile: Partial<PrinterResponseProfile>
): PrinterResponseProfile {
  const inst = getOrCreateInstance();
  if (!inst.responseProfile) {
    getPrinterResponseProfile();
  }
  inst.responseProfile = {
    ...inst.responseProfile,
    ...profile,
    lastCapturedFromRealPrinter:
      profile.lastCapturedFromRealPrinter !== undefined
        ? profile.lastCapturedFromRealPrinter
        : inst.responseProfile.lastCapturedFromRealPrinter,
  };

  addLog(
    inst,
    `Updated Driver Response Profile: TSPL Status: 0x${inst.responseProfile.tsplStatusByte.toString(16).padStart(2, '0')}, ESC/POS Status: 0x${inst.responseProfile.escPosStatusByte.toString(16).padStart(2, '0')}`,
    'system'
  );

  return inst.responseProfile;
}

export function clearPrintHistory(): void {
  const inst = getOrCreateInstance();
  inst.history = [];
  inst.latestJob = null;
  addLog(inst, 'Print history cleared', 'system');
}

/**
 * Generates sample TSPL labels matching Codi Net Web Theme 2 packing stickers.
 */
export function generateSampleTspl(type: 'wholesale' | 'retail' | 'step2' | 'box'): string {
  const DOTS_PER_MM = 8;
  const mm = (v: number) => Math.round(v * DOTS_PER_MM);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  let orderNo = 'ORD-2026-8842';
  let category = 'Moragahahena Hub';
  let orderType = 'Wholesale';
  let timeSlot = '08:00 AM - 11:30 AM';
  let stepIndex = 'Step 1/1';
  let stepLabel = 'Main Corrugated Carton';
  let qr = 'ORD-2026-8842';

  if (type === 'retail') {
    orderNo = 'ORD-2026-9931';
    category = 'Colombo Central Hub';
    orderType = 'Retail Express';
    timeSlot = '01:00 PM - 04:00 PM';
    stepIndex = 'Step 1/1';
    stepLabel = 'Insulated Fresh Bag';
    qr = 'ORD-2026-9931';
  } else if (type === 'step2') {
    orderNo = 'ORD-2026-7712';
    category = 'Kandy Distribution Hub';
    orderType = 'Wholesale Bulk';
    timeSlot = '06:00 AM - 09:00 AM';
    stepIndex = 'Step 2/3';
    stepLabel = 'Secondary Box (Cold Pack)';
    qr = 'ORD-2026-7712-BOX2';
  } else if (type === 'box') {
    orderNo = 'ORD-2026-5504';
    category = 'Gampaha Cross-Dock';
    orderType = 'B2B Cargo';
    timeSlot = '10:00 AM - 01:00 PM';
    stepIndex = 'Step 3/3';
    stepLabel = 'Pallet Crate 3 (Heavy)';
    qr = 'ORD-2026-5504-BOX3';
  }

  const lines = [
    'SIZE 50 mm, 30 mm',
    'GAP 2 mm, 0 mm',
    'REFERENCE 0,0',
    'DIRECTION 1',
    'DENSITY 10',
    'SPEED 4',
    'CLS',
    `TEXT ${mm(2.0)},${mm(2.0)},"3",0,1,1,"${orderNo}"`,
    `TEXT ${mm(2.0)},${mm(5.6)},"1",0,1,1,"${category}"`,
    `TEXT ${mm(2.0)},${mm(9.2)},"1",0,1,1,"${orderType}"`,
    `TEXT ${mm(2.0)},${mm(12.6)},"1",0,1,1,"${dateStr}"`,
    `TEXT ${mm(2.0)},${mm(16.0)},"1",0,1,1,"${timeSlot}"`,
    `TEXT ${mm(2.0)},${mm(19.4)},"1",0,1,1,"${stepIndex}"`,
    `QRCODE ${mm(28.2)},${mm(2.0)},L,8,A,0,"${qr}"`,
    `BAR ${mm(2.0)},${mm(24.0)},${mm(46)},${mm(0.3)}`,
    `TEXT ${mm(3.0)},${mm(25.8)},"1",0,1,1,"${stepLabel}"`,
    'PRINT 1,1',
  ];

  return lines.join('\r\n') + '\r\n';
}
