/**
 * Chrome Web Bluetooth API Client for XP-365B and BLE Thermal Printers (50x30mm)
 * Allows direct browser-to-hardware printing using Google Chrome / Microsoft Edge.
 * Captures real hardware printer responses and synchronizes with virtual driver.
 */
export const XP365B_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const XP365B_WRITE_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export interface BluetoothConnectionState {
  isConnected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  serviceUuid?: string | null;
  characteristicUuid?: string | null;
  error: string | null;
}

export interface BluetoothLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'data';
  message: string;
}

export interface CapturedPrinterResponse {
  bytes: number[];
  hex: string;
  description: string;
  timestamp: string;
}

export class WebBluetoothPrinter {
  private device: any = null;
  private server: any = null;
  private writeCharacteristic: any = null;
  private notifyCharacteristics: any[] = [];
  private readCharacteristics: any[] = [];
  private onStateChange: ((state: BluetoothConnectionState) => void) | null = null;
  private onLog: ((log: BluetoothLogEntry) => void) | null = null;
  private onResponseCapture: ((resp: CapturedPrinterResponse) => void) | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public setOnStateChange(cb: (state: BluetoothConnectionState) => void) {
    this.onStateChange = cb;
  }

  public setOnLog(cb: (log: BluetoothLogEntry) => void) {
    this.onLog = cb;
  }

  public setOnResponseCapture(cb: (resp: CapturedPrinterResponse) => void) {
    this.onResponseCapture = cb;
  }

  public isConnected(): boolean {
    return !!(this.device?.gatt?.connected && this.writeCharacteristic);
  }

  public getDeviceName(): string | null {
    return this.device?.name || null;
  }

  private log(type: BluetoothLogEntry['type'], message: string) {
    const time = new Date().toLocaleTimeString();
    if (this.onLog) {
      this.onLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: time,
        type,
        message,
      });
    }
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      const msg = 'Web Bluetooth is not supported in this browser. Please open in Google Chrome or Microsoft Edge.';
      this.log('error', msg);
      throw new Error(msg);
    }

    try {
      this.log('info', 'Opening Chrome Web Bluetooth device selector...');

      // 1. Request Bluetooth device via Chrome native pairing popup
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          XP365B_SERVICE_UUID,
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000e7cf-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '00001800-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
        ],
      });

      const name = this.device.name || 'XP-365B';
      this.log('info', `Selected device: "${name}" (ID: ${this.device.id.slice(0, 8)}...)`);

      this.device.addEventListener('gattserverdisconnected', () => {
        this.writeCharacteristic = null;
        this.notifyCharacteristics = [];
        this.readCharacteristics = [];
        this.server = null;
        this.log('warn', `Printer "${name}" disconnected.`);
        this.notifyState(false, null, null, null, null, 'Printer disconnected');
      });

      // 2. Connect to GATT Server
      this.log('info', 'Connecting to GATT Server on printer...');
      this.server = await this.device.gatt.connect();
      this.log('success', 'GATT Server connected successfully.');

      // 3. Discover primary services and locate writable, notify & read characteristics
      this.log('info', 'Discovering primary services...');
      const services = await this.server.getPrimaryServices();
      let foundWriteChar: any = null;
      let matchedServiceUuid: string | null = null;
      this.notifyCharacteristics = [];
      this.readCharacteristics = [];

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (!foundWriteChar && (c.properties.write || c.properties.writeWithoutResponse)) {
              foundWriteChar = c;
              matchedServiceUuid = service.uuid;
            }
            if (c.properties.notify || c.properties.indicate) {
              this.notifyCharacteristics.push(c);
            }
            if (c.properties.read) {
              this.readCharacteristics.push(c);
            }
          }
        } catch {
          // Ignore service read errors
        }
      }

      if (!foundWriteChar) {
        throw new Error(
          'No writable thermal printer data channel found on the selected device. Ensure printer is powered on and in BLE mode.'
        );
      }

      this.writeCharacteristic = foundWriteChar;

      // Subscribe to real printer notifications on all discoverable notify channels
      for (const notifyChar of this.notifyCharacteristics) {
        try {
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', (event: any) => {
            const val = event.target.value;
            const bytes: number[] = [];
            for (let i = 0; i < val.byteLength; i++) {
              bytes.push(val.getUint8(i));
            }
            const hex = bytes.map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ');
            const desc = this.interpretPrinterStatusByte(bytes[0] ?? 0);

            this.log('data', `[Real Printer Response Captured] ${hex} (${desc})`);

            const captureInfo: CapturedPrinterResponse = {
              bytes,
              hex,
              description: desc,
              timestamp: new Date().toLocaleTimeString(),
            };

            if (this.onResponseCapture) {
              this.onResponseCapture(captureInfo);
            }

            this.syncCapturedResponseWithDriver(bytes[0] ?? 0, hex, desc);
          });
          this.log('info', `Subscribed to notify channel (${notifyChar.uuid.slice(0, 8)}...).`);
        } catch {
          // Channel subscription non-blocking
        }
      }

      this.log(
        'success',
        `Ready to print! Service: ${matchedServiceUuid?.slice(0, 8)}..., Write: ${foundWriteChar.uuid.slice(0, 8)}...`
      );

      this.notifyState(
        true,
        name,
        this.device.id,
        matchedServiceUuid,
        foundWriteChar.uuid,
        null
      );

      // Query status immediately after connection
      setTimeout(() => {
        this.queryTsplStatus().catch(() => {});
      }, 350);

      return true;
    } catch (err: any) {
      const errMsg = err.message || 'Connection cancelled or failed';
      this.log('error', `Connection error: ${errMsg}`);
      this.notifyState(false, null, null, null, null, errMsg);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch {}
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristics = [];
    this.readCharacteristics = [];
    this.log('info', 'Disconnected from printer.');
    this.notifyState(false, null, null, null, null, null);
  }

  public async printTSPL(
    tsplString: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; bytesWritten: number; durationMs: number }> {
    if (!this.writeCharacteristic) {
      const err = 'Bluetooth printer is not connected. Connect via Chrome first.';
      this.log('error', err);
      throw new Error(err);
    }

    const startTime = Date.now();
    const encoder = new TextEncoder();
    const data = encoder.encode(tsplString);
    const CHUNK_SIZE = 64;
    const total = data.length;

    this.log('info', `Sending TSPL job (${total} bytes in ~${Math.ceil(total / CHUNK_SIZE)} chunks) to physical XP-365B...`);

    for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      if (this.writeCharacteristic.properties.writeWithoutResponse) {
        await this.writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.writeCharacteristic.writeValue(chunk);
      }

      const percent = Math.min(100, Math.round(((offset + chunk.length) / total) * 100));
      if (onProgress) {
        onProgress(percent);
      }
      // 25ms delay to prevent buffer overrun on XP-365B BLE chipsets
      await new Promise((r) => setTimeout(r, 25));
    }

    const durationMs = Date.now() - startTime;
    this.log('success', `Print job delivered successfully! (${total} bytes transferred in ${durationMs}ms)`);
    return { success: true, bytesWritten: total, durationMs };
  }

  /**
   * Feeds 1 label forward to check gap alignment
   */
  public async feedLabel(): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected');
    }
    this.log('info', 'Sending Form Feed command to XP-365B...');
    const feedCmd = 'FORMFEED\r\n';
    await this.printTSPL(feedCmd);
  }

  /**
   * Queries real TSPL printer status (~@ command: 0x7E 0x40)
   */
  public async queryTsplStatus(): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected');
    }
    this.log('info', 'Sending TSPL Status Enquiry command (~@)...');
    const bytes = new Uint8Array([0x7e, 0x40]);
    if (this.writeCharacteristic.properties.writeWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(bytes);
    } else {
      await this.writeCharacteristic.writeValue(bytes);
    }

    // Also attempt readValue on readable characteristics if available
    setTimeout(async () => {
      for (const readChar of this.readCharacteristics) {
        try {
          const val = await readChar.readValue();
          if (val && val.byteLength > 0) {
            const b0 = val.getUint8(0);
            const hex = '0x' + b0.toString(16).padStart(2, '0');
            const desc = this.interpretPrinterStatusByte(b0);
            this.log('data', `[Real Printer Response Captured via Read] ${hex} (${desc})`);

            const captureInfo: CapturedPrinterResponse = {
              bytes: [b0],
              hex,
              description: desc,
              timestamp: new Date().toLocaleTimeString(),
            };
            if (this.onResponseCapture) {
              this.onResponseCapture(captureInfo);
            }
            this.syncCapturedResponseWithDriver(b0, hex, desc);
            break;
          }
        } catch {}
      }
    }, 150);
  }

  /**
   * Queries real TSPL error state (~!@ command: 0x7E 0x21 0x40)
   */
  public async queryDetailedStatus(): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected');
    }
    this.log('info', 'Sending Detailed TSPL Error Enquiry (~!@)...');
    const bytes = new Uint8Array([0x7e, 0x21, 0x40]);
    if (this.writeCharacteristic.properties.writeWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(bytes);
    } else {
      await this.writeCharacteristic.writeValue(bytes);
    }
  }

  /**
   * Queries real ESC/POS status (0x10 0x04 0x01)
   */
  public async queryEscPosStatus(): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected');
    }
    this.log('info', 'Sending ESC/POS Real-Time Status query (DLE EOT 1)...');
    const bytes = new Uint8Array([0x10, 0x04, 0x01]);
    if (this.writeCharacteristic.properties.writeWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(bytes);
    } else {
      await this.writeCharacteristic.writeValue(bytes);
    }
  }

  /**
   * Decodes TSPL status byte into human readable description
   */
  public interpretPrinterStatusByte(status: number): string {
    if (status === 0x00) {
      return 'Printer Normal / Ready (Head closed, paper present, idle)';
    }
    if (status === 0x12) {
      return 'ESC/POS Online / Ready (Standard printer ready)';
    }

    const errors: string[] = [];
    if (status & 0x01) errors.push('Print head opened');
    if (status & 0x02) errors.push('Paper jam');
    if (status & 0x04) errors.push('Out of paper');
    if (status & 0x08) errors.push('Ribbon error');
    if (status & 0x10) errors.push('Paused');
    if (status & 0x20) errors.push('Printing in progress');
    if (status & 0x40) errors.push('Hardware error');

    return errors.length > 0 ? errors.join(', ') : `Status: 0x${status.toString(16)}`;
  }

  /**
   * Synchronizes captured real printer response with the local virtual printer server
   * so other drivers/devices (Codi Net phone) receive this exact response!
   */
  private async syncCapturedResponseWithDriver(statusByte: number, hex: string, description: string) {
    try {
      await fetch('/api/printer/response-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tsplStatusByte: statusByte,
          escPosStatusByte: statusByte === 0 ? 0x12 : statusByte,
          lastCapturedFromRealPrinter: {
            hex,
            description,
            timestamp: new Date().toLocaleTimeString(),
            source: this.device?.name || 'XP-365B Physical',
          },
        }),
      });
      this.log('success', `[Driver Synced] Virtual driver now mirrors real printer response: ${hex} (${description})`);
    } catch {
      // Sync fail non-fatal
    }
  }

  private notifyState(
    isConnected: boolean,
    deviceName: string | null,
    deviceId: string | null,
    serviceUuid?: string | null,
    characteristicUuid?: string | null,
    error?: string | null
  ) {
    if (this.onStateChange) {
      this.onStateChange({
        isConnected,
        deviceName,
        deviceId,
        serviceUuid: serviceUuid || null,
        characteristicUuid: characteristicUuid || null,
        error: error || null,
      });
    }
  }
}

// Singleton instance for easy sharing across workspace components
export const webBluetoothPrinter = new WebBluetoothPrinter();
