'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  AlignLeft,
  AlignRight,
  Bluetooth,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Loader2,
  Maximize2,
  Play,
  Power,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  webBluetoothPrinter,
  BluetoothConnectionState,
  BluetoothLogEntry,
  CapturedPrinterResponse,
} from '@/lib/printer/webBluetoothPrinter';
import { generateQrSvg } from '@/lib/printer/qrGenerator';

interface ChromeBluetoothPrinterStudioProps {
  onSimulatePrint?: (tspl: string, details: any) => void;
  serverState?: any;
  onRefreshServer?: () => void;
}

export const ChromeBluetoothPrinterStudio: React.FC<ChromeBluetoothPrinterStudioProps> = ({
  onSimulatePrint,
  serverState,
  onRefreshServer,
}) => {
  // Bluetooth Connection State (Physical XP-365B via Chrome Web BLE)
  const [btState, setBtState] = useState<BluetoothConnectionState>({
    isConnected: false,
    deviceName: null,
    deviceId: null,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [btLogs, setBtLogs] = useState<BluetoothLogEntry[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Real Printer Response Capture & Driver Mirroring
  const [capturedResponse, setCapturedResponse] = useState<CapturedPrinterResponse | null>({
    bytes: [0x00],
    hex: '0x00',
    description: 'Printer Normal / Ready (Head closed, paper present, idle)',
    timestamp: 'Baseline Active',
  });
  const [mirroredStatusByte, setMirroredStatusByte] = useState<number>(0);
  const [isQueryingStatus, setIsQueryingStatus] = useState<boolean>(false);

  // === CARD 1 SETTINGS: 50x30 Label & QR Configuration ===
  // QR Inclusion Toggle: true = Print with QR, false = Text Only (No QR)
  const [includeQr, setIncludeQr] = useState<boolean>(true);
  // Text Side Adjustment: 'left' = Text Left & QR Right, 'right' = Text Right & QR Left
  const [textSide, setTextSide] = useState<'left' | 'right'>('left');
  // QR Cell Size: 4 = Compact (100 dots), 5 = Standard (125 dots)
  const [qrCellSize, setQrCellSize] = useState<4 | 5>(5);

  // Text Size Adjustment Settings
  const [titleSize, setTitleSize] = useState<'small' | 'standard' | 'large' | 'xlarge'>('standard');
  const [detailSize, setDetailSize] = useState<'compact' | 'standard' | 'large'>('compact');

  // 4-Row Print Mode Fields (Addresses: "IP Address / 192.168.8.30 / PORT / 33581 like that add 4 rows")
  const [row1, setRow1] = useState<string>('IP Address');
  const [row2, setRow2] = useState<string>('192.168.8.30');
  const [row3, setRow3] = useState<string>('PORT');
  const [row4, setRow4] = useState<string>('33581');
  const [fourRowAlign, setFourRowAlign] = useState<'center' | 'left'>('center');
  const [fourRowDivider, setFourRowDivider] = useState<boolean>(true);
  const [fourRowSize, setFourRowSize] = useState<'compact' | 'standard' | 'large' | 'xlarge' | 'giant'>('large');

  // Simple Text / IP Address Print Mode (Direct single text without extra sections)
  const [simpleText, setSimpleText] = useState<string>('192.168.8.30:33581');
  const [simpleTextSize, setSimpleTextSize] = useState<'normal' | 'medium' | 'big' | 'huge' | 'giant'>('big');
  const [simpleTextAlign, setSimpleTextAlign] = useState<'center' | 'left'>('center');

  // Label Design Mode: 'four-rows' (Default) | 'simple-ip' | 'custom-free' | 'codi-pack' | 'shipping' | 'raw-tspl'
  const [designMode, setDesignMode] = useState<
    'four-rows' | 'simple-ip' | 'custom-free' | 'codi-pack' | 'shipping' | 'raw-tspl'
  >('four-rows');

  // Custom Text & QR Fields
  const [customHeader, setCustomHeader] = useState('POLYGON APEX-5030');
  const [customLine1, setCustomLine1] = useState('Item: Grade-A Hydroponic Pack');
  const [customLine2, setCustomLine2] = useState('Batch: #BATCH-2026-X8');
  const [customLine3, setCustomLine3] = useState('QC Status: PASSED (Verified)');
  const [customFooter, setCustomFooter] = useState('STORAGE: COOL & DRY • EXPORT READY');
  const [customQr, setCustomQr] = useState('APEX-5030-9988');

  // Codi Net Theme 2 Pack Fields
  const [packOrderNo, setPackOrderNo] = useState('ORD-52901-X');
  const [packCategory, setPackCategory] = useState('Meegoda Central Hub');
  const [packType, setPackType] = useState('WHOLESALE BULK');
  const [packDate, setPackDate] = useState('2026-10-20');
  const [packTimeSlot, setPackTimeSlot] = useState('09:00 AM - 12:30 PM');
  const [packStepIndex, setPackStepIndex] = useState('Step 1 of 3');
  const [packStepLabel, setPackStepLabel] = useState('Carton Box 1/3 (Green Veg)');
  const [packQr, setPackQr] = useState('ORD-52901-X');

  // Shipping Fields
  const [shipTrackingNo, setShipTrackingNo] = useState('TRK-98214-LK');
  const [shipSender, setShipSender] = useState('Polygon Central Warehouse');
  const [shipReceiver, setShipReceiver] = useState('Colombo Express Retail #4');
  const [shipRoute, setShipRoute] = useState('ZONE-B • HIGHWAY DIRECT');

  // Raw TSPL
  const [rawTsplText, setRawTsplText] = useState('');

  // Visualizer Animation
  const [isFeedingAnimation, setIsFeedingAnimation] = useState(false);
  const [lastPrintedAt, setLastPrintedAt] = useState<string | null>(null);

  // CARD 2 SETTINGS: Virtual Printer (Act as Printer for Phone / Codi Net)
  const [isTogglingServerBt, setIsTogglingServerBt] = useState(false);

  // Log container ref for auto-scrolling
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSupported(webBluetoothPrinter.isSupported());

    webBluetoothPrinter.setOnStateChange((state) => {
      setBtState(state);
    });

    webBluetoothPrinter.setOnLog((log) => {
      setBtLogs((prev) => [...prev.slice(-99), log]);
      setTimeout(() => {
        if (logScrollRef.current) {
          logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    webBluetoothPrinter.setOnResponseCapture((resp) => {
      setCapturedResponse(resp);
      setMirroredStatusByte(resp.bytes[0] ?? 0);
    });

    // Fetch initial profile
    fetch('/api/printer/response-profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.tsplStatusByte !== undefined) {
          setMirroredStatusByte(data.tsplStatusByte);
        }
        if (data.lastCapturedFromRealPrinter) {
          setCapturedResponse({
            bytes: [data.tsplStatusByte],
            hex: data.lastCapturedFromRealPrinter.hex,
            description: data.lastCapturedFromRealPrinter.description,
            timestamp: data.lastCapturedFromRealPrinter.timestamp,
          });
        }
      })
      .catch(() => {});

    // Check if already connected
    if (webBluetoothPrinter.isConnected()) {
      setBtState({
        isConnected: true,
        deviceName: webBluetoothPrinter.getDeviceName(),
        deviceId: 'connected',
        error: null,
      });
    }
  }, []);

  const getSimpleTextFontConfig = (
    text: string,
    size: 'normal' | 'medium' | 'big' | 'huge' | 'giant'
  ) => {
    const len = text.length || 1;
    let font = '3';
    let multX = 1;
    let multY = 1;
    let charWidth = 16;
    let charHeight = 24;

    if (size === 'normal') {
      font = '2';
      charWidth = 12;
      charHeight = 20;
      multX = 1;
      multY = 1;
    } else if (size === 'medium') {
      font = '3';
      charWidth = 16;
      charHeight = 24;
      multX = 1;
      multY = 1;
    } else if (size === 'big') {
      font = '3';
      charWidth = 16;
      charHeight = 48; // 2x height
      multX = 1;
      multY = 2;
    } else if (size === 'huge') {
      font = '4';
      charWidth = 24;
      charHeight = 32;
      multX = 1;
      multY = 1;
      if (len * 24 > 370) {
        font = '3';
        charWidth = 16;
        charHeight = 48;
        multX = 1;
        multY = 2;
      }
    } else if (size === 'giant') {
      font = '3';
      charWidth = 32;
      charHeight = 48;
      multX = 2;
      multY = 2;
      if (len * 32 > 370) {
        charWidth = 16;
        charHeight = 48;
        multX = 1;
        multY = 2;
      }
    }

    const totalWidth = len * charWidth;
    const x = Math.max(16, Math.round((400 - totalWidth) / 2));
    const y = Math.max(20, Math.round((240 - charHeight) / 2));

    return { font, multX, multY, x, y };
  };

  const getSimpleVisualizerClass = (size: 'normal' | 'medium' | 'big' | 'huge' | 'giant') => {
    switch (size) {
      case 'normal':
        return 'text-sm sm:text-base';
      case 'medium':
        return 'text-base sm:text-lg';
      case 'big':
        return 'text-lg sm:text-xl tracking-tight';
      case 'huge':
        return 'text-xl sm:text-2xl tracking-tighter';
      case 'giant':
        return 'text-2xl sm:text-3xl font-black tracking-tighter';
      default:
        return 'text-lg sm:text-xl tracking-tight';
    }
  };

  // Generate Strictly Calibrated TSPL for XP-365B (400 dots width x 240 dots height)
  const generateCurrentTspl = (): string => {
    if (designMode === 'raw-tspl' && rawTsplText.trim()) {
      return rawTsplText.trim() + '\r\n';
    }

    // Hardware parameters calibrated for 50x30mm thermal roll
    const header = [
      'SIZE 50 mm, 30 mm',
      'GAP 2 mm, 0 mm',
      'REFERENCE 0,0',
      'DIRECTION 1,0',
      'DENSITY 10',
      'SPEED 3',
      'SET CUTTER OFF',
      'SET PEEL OFF',
      'CLS',
    ];

    const commands: string[] = [...header];

    // Case 00: 4-ROW FORMAT (IP Address / 192.168.8.30 / PORT / 33581)
    if (designMode === 'four-rows') {
      const r1 = (row1 || 'IP Address').replace(/"/g, '').trim();
      const r2 = (row2 || '192.168.8.30').replace(/"/g, '').trim();
      const r3 = (row3 || 'PORT').replace(/"/g, '').trim();
      const r4 = (row4 || '33581').replace(/"/g, '').trim();

      // Calibrated TSPL Fonts:
      // "1": 8x12 dots
      // "2": 12x20 dots
      // "3": 16x24 dots
      // "4": 24x32 dots
      // "5": 32x48 dots
      let lblFont = '2';
      let lblCharW = 12;
      let lblCharH = 20;

      let valFont = '4';
      let valMultX = 1;
      let valMultY = 1;
      let valCharW = 24;
      let valCharH = 32;

      let gapHdrVal = 5;
      let gapMid = fourRowDivider ? 10 : 8;
      let barH = fourRowDivider ? 2 : 0;

      if (fourRowSize === 'compact') {
        lblFont = '1';
        lblCharW = 8;
        lblCharH = 12;

        valFont = '2';
        valMultX = 1;
        valMultY = 1;
        valCharW = 12;
        valCharH = 20;

        gapHdrVal = 4;
        gapMid = 8;
      } else if (fourRowSize === 'standard') {
        lblFont = '2';
        lblCharW = 12;
        lblCharH = 20;

        valFont = '3';
        valMultX = 1;
        valMultY = 1;
        valCharW = 16;
        valCharH = 24;

        gapHdrVal = 5;
        gapMid = 10;
      } else if (fourRowSize === 'large') {
        // High-visibility: Bold labels, large values
        lblFont = '2';
        lblCharW = 12;
        lblCharH = 20;

        // Font 3 with 2x height (16x48 dots) - tall, bold and dark
        valFont = '3';
        valMultX = 1;
        valMultY = 2;
        valCharW = 16;
        valCharH = 48;

        gapHdrVal = 5;
        gapMid = 10;
      } else if (fourRowSize === 'xlarge') {
        // Extra Large: Font 3 labels (16x24), Font 4 values (24x32)
        lblFont = '3';
        lblCharW = 16;
        lblCharH = 24;

        valFont = '4';
        valMultX = 1;
        valMultY = 1;
        valCharW = 24;
        valCharH = 32;
        if (Math.max(r2.length, r4.length) * 24 > 370) {
          valFont = '3';
          valMultX = 1;
          valMultY = 2;
          valCharW = 16;
          valCharH = 48;
        }

        gapHdrVal = 6;
        gapMid = 10;
      } else if (fourRowSize === 'giant') {
        // Maximum size: 2x2 Font 3 if length fits, else Font 4
        lblFont = '3';
        lblCharW = 16;
        lblCharH = 24;

        const maxLen = Math.max(r2.length, r4.length);
        if (maxLen * 32 <= 380) {
          valFont = '3';
          valMultX = 2;
          valMultY = 2;
          valCharW = 32;
          valCharH = 48;
        } else {
          valFont = '4';
          valMultX = 1;
          valMultY = 1;
          valCharW = 24;
          valCharH = 32;
        }

        gapHdrVal = 6;
        gapMid = 10;
      }

      // Mathematical Vertical Centering in 240 dots:
      const totalContentHeight =
        lblCharH +
        gapHdrVal +
        valCharH +
        gapMid +
        barH +
        gapMid +
        lblCharH +
        gapHdrVal +
        valCharH;

      const yStart = Math.max(8, Math.round((240 - totalContentHeight) / 2));

      const y1 = yStart;
      const y2 = y1 + lblCharH + gapHdrVal;
      const yBar = y2 + valCharH + gapMid;
      const y3 = fourRowDivider ? yBar + barH + gapMid : y2 + valCharH + gapMid * 2;
      const y4 = y3 + lblCharH + gapHdrVal;

      const getX = (text: string, charWidth: number) => {
        if (fourRowAlign === 'left') return 24;
        const totalW = text.length * charWidth;
        return Math.max(16, Math.round((400 - totalW) / 2));
      };

      if (r1) commands.push(`TEXT ${getX(r1, lblCharW)},${y1},"${lblFont}",0,1,1,"${r1}"`);
      if (r2) commands.push(`TEXT ${getX(r2, valCharW)},${y2},"${valFont}",0,${valMultX},${valMultY},"${r2}"`);
      if (fourRowDivider) commands.push(`BAR 24,${yBar},352,2`);
      if (r3) commands.push(`TEXT ${getX(r3, lblCharW)},${y3},"${lblFont}",0,1,1,"${r3}"`);
      if (r4) commands.push(`TEXT ${getX(r4, valCharW)},${y4},"${valFont}",0,${valMultX},${valMultY},"${r4}"`);

      commands.push('PRINT 1,1', '');
      return commands.join('\r\n');
    }

    // Case 0: SIMPLE TEXT / IP ADDRESS ONLY (NO EXTRA SECTIONS)
    if (designMode === 'simple-ip') {
      const cleanText = (simpleText || '192.168.8.30:33581').replace(/"/g, '').trim();
      const cfg = getSimpleTextFontConfig(cleanText, simpleTextSize);
      const posX = simpleTextAlign === 'center' ? cfg.x : 24;
      commands.push(
        `TEXT ${posX},${cfg.y},"${cfg.font}",0,${cfg.multX},${cfg.multY},"${cleanText}"`,
        'PRINT 1,1',
        ''
      );
      return commands.join('\r\n');
    }

    const getTitleFont = () => {
      switch (titleSize) {
        case 'small': return { font: '2', multX: 1, multY: 1 };
        case 'standard': return { font: '3', multX: 1, multY: 1 };
        case 'large': return { font: '4', multX: 1, multY: 1 };
        case 'xlarge': return { font: '3', multX: 2, multY: 2 };
        default: return { font: '3', multX: 1, multY: 1 };
      }
    };

    const getDetailFont = () => {
      switch (detailSize) {
        case 'compact': return { font: '1', multX: 1, multY: 1 };
        case 'standard': return { font: '2', multX: 1, multY: 1 };
        case 'large': return { font: '3', multX: 1, multY: 1 };
        default: return { font: '1', multX: 1, multY: 1 };
      }
    };

    const tf = getTitleFont();
    const df = getDetailFont();

    // Case A: TEXT ONLY (NO QR CODE) - Full 50mm Width
    if (!includeQr) {
      if (designMode === 'codi-pack') {
        commands.push(
          `TEXT 16,14,"${tf.font}",0,${tf.multX},${tf.multY},"${packOrderNo.replace(/"/g, '')}"`,
          `TEXT 16,48,"${df.font}",0,${df.multX},${df.multY},"${packCategory.replace(/"/g, '')}"`,
          `TEXT 16,78,"${df.font}",0,${df.multX},${df.multY},"${packType.replace(/"/g, '')} • ${packStepIndex.replace(/"/g, '')}"`,
          `TEXT 16,108,"${df.font}",0,${df.multX},${df.multY},"${packDate}   ${packTimeSlot}"`,
          'BAR 16,150,368,2',
          `TEXT 16,168,"2",0,1,1,"${packStepLabel.replace(/"/g, '')}"`
        );
      } else if (designMode === 'shipping') {
        commands.push(
          `TEXT 16,14,"${tf.font}",0,${tf.multX},${tf.multY},"${shipTrackingNo.replace(/"/g, '')}"`,
          `TEXT 16,48,"${df.font}",0,${df.multX},${df.multY},"FROM: ${shipSender.replace(/"/g, '')}"`,
          `TEXT 16,78,"${df.font}",0,${df.multX},${df.multY},"TO:   ${shipReceiver.replace(/"/g, '')}"`,
          `TEXT 16,108,"${df.font}",0,${df.multX},${df.multY},"ROUTE: ${shipRoute.replace(/"/g, '')}"`,
          'BAR 16,150,368,2',
          'TEXT 16,168,"2",0,1,1,"POLYGON LOGISTICS EXPRESS"'
        );
      } else {
        // custom-free text only
        commands.push(
          `TEXT 16,14,"${tf.font}",0,${tf.multX},${tf.multY},"${customHeader.replace(/"/g, '')}"`,
          `TEXT 16,48,"${df.font}",0,${df.multX},${df.multY},"${customLine1.replace(/"/g, '')}"`,
          `TEXT 16,78,"${df.font}",0,${df.multX},${df.multY},"${customLine2.replace(/"/g, '')}"`,
          `TEXT 16,108,"${df.font}",0,${df.multX},${df.multY},"${customLine3.replace(/"/g, '')}"`,
          'BAR 16,150,368,2',
          `TEXT 16,168,"2",0,1,1,"${customFooter.replace(/"/g, '')}"`
        );
      }
      commands.push('PRINT 1,1', '');
      return commands.join('\r\n');
    }

    // Case B: WITH QR CODE (Calibrated Coordinates so QR never overflows 400 dots)
    const qrData =
      designMode === 'codi-pack'
        ? packQr
        : designMode === 'shipping'
        ? shipTrackingNo
        : customQr;

    const qrCell = qrCellSize; // 4 or 5
    // QR max width: 25 * 5 = 125 dots.
    const textX = textSide === 'left' ? 16 : 160;
    const qrX = textSide === 'left' ? 240 : 16;

    if (designMode === 'codi-pack') {
      commands.push(
        `TEXT ${textX},14,"${tf.font}",0,${tf.multX},${tf.multY},"${packOrderNo.replace(/"/g, '')}"`,
        `TEXT ${textX},46,"${df.font}",0,${df.multX},${df.multY},"${packCategory.replace(/"/g, '')}"`,
        `TEXT ${textX},70,"${df.font}",0,${df.multX},${df.multY},"${packType.replace(/"/g, '')}"`,
        `TEXT ${textX},94,"${df.font}",0,${df.multX},${df.multY},"${packDate} ${packTimeSlot}"`,
        `TEXT ${textX},118,"${df.font}",0,${df.multX},${df.multY},"${packStepIndex.replace(/"/g, '')}"`,
        `QRCODE ${qrX},14,L,${qrCell},A,0,"${qrData.replace(/"/g, '')}"`,
        'BAR 16,168,368,2',
        `TEXT 16,182,"2",0,1,1,"${packStepLabel.replace(/"/g, '')}"`
      );
    } else if (designMode === 'shipping') {
      commands.push(
        `TEXT ${textX},14,"${tf.font}",0,${tf.multX},${tf.multY},"${shipTrackingNo.replace(/"/g, '')}"`,
        `TEXT ${textX},46,"${df.font}",0,${df.multX},${df.multY},"FROM: ${shipSender.replace(/"/g, '')}"`,
        `TEXT ${textX},70,"${df.font}",0,${df.multX},${df.multY},"TO:   ${shipReceiver.replace(/"/g, '')}"`,
        `TEXT ${textX},94,"${df.font}",0,${df.multX},${df.multY},"ROUTE: ${shipRoute.replace(/"/g, '')}"`,
        `QRCODE ${qrX},14,L,${qrCell},A,0,"${qrData.replace(/"/g, '')}"`,
        'BAR 16,168,368,2',
        'TEXT 16,182,"1",0,1,1,"POLYGON LOGISTICS EXPRESS"'
      );
    } else {
      // custom-free with QR
      commands.push(
        `TEXT ${textX},14,"${tf.font}",0,${tf.multX},${tf.multY},"${customHeader.replace(/"/g, '')}"`,
        `TEXT ${textX},46,"${df.font}",0,${df.multX},${df.multY},"${customLine1.replace(/"/g, '')}"`,
        `TEXT ${textX},70,"${df.font}",0,${df.multX},${df.multY},"${customLine2.replace(/"/g, '')}"`,
        `TEXT ${textX},94,"${df.font}",0,${df.multX},${df.multY},"${customLine3.replace(/"/g, '')}"`,
        `QRCODE ${qrX},14,L,${qrCell},A,0,"${qrData.replace(/"/g, '')}"`,
        'BAR 16,168,368,2',
        `TEXT 16,182,"1",0,1,1,"${customFooter.replace(/"/g, '')}"`
      );
    }

    commands.push('PRINT 1,1', '');
    return commands.join('\r\n');
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await webBluetoothPrinter.connect();
    } catch (err: any) {
      // Logged in client
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await webBluetoothPrinter.disconnect();
  };

  const handlePrintPhysical = async () => {
    const tspl = generateCurrentTspl();
    setIsPrinting(true);
    setPrintProgress(0);
    try {
      triggerVisualFeed();
      await webBluetoothPrinter.printTSPL(tspl, (percent) => {
        setPrintProgress(percent);
      });
      setLastPrintedAt(new Date().toLocaleTimeString());
      if (onSimulatePrint) {
        onSimulatePrint(tspl, { source: 'chrome-ble', device: btState.deviceName });
      }
    } catch (err: any) {
      // Logged in client
    } finally {
      setIsPrinting(false);
    }
  };

  const handleFeedOneLabel = async () => {
    setIsFeeding(true);
    try {
      triggerVisualFeed();
      await webBluetoothPrinter.feedLabel();
    } catch (err: any) {
      // Logged
    } finally {
      setIsFeeding(false);
    }
  };

  const handleSimulateFeed = () => {
    triggerVisualFeed();
    const tspl = generateCurrentTspl();
    setLastPrintedAt(new Date().toLocaleTimeString());
    if (onSimulatePrint) {
      onSimulatePrint(tspl, { source: 'simulated-chrome' });
    }
  };

  const triggerVisualFeed = () => {
    setIsFeedingAnimation(true);
    setTimeout(() => setIsFeedingAnimation(false), 700);
  };

  const handleQueryStatus = async (type: 'tspl' | 'tspl_detailed' | 'escpos') => {
    if (!btState.isConnected) return;
    setIsQueryingStatus(true);
    try {
      if (type === 'tspl') await webBluetoothPrinter.queryTsplStatus();
      else if (type === 'tspl_detailed') await webBluetoothPrinter.queryDetailedStatus();
      else if (type === 'escpos') await webBluetoothPrinter.queryEscPosStatus();
    } catch {}
    finally {
      setIsQueryingStatus(false);
    }
  };

  const handleSetMirroredByte = async (byteVal: number, desc: string) => {
    setMirroredStatusByte(byteVal);
    const hex = '0x' + byteVal.toString(16).padStart(2, '0');
    setCapturedResponse({
      bytes: [byteVal],
      hex,
      description: desc,
      timestamp: new Date().toLocaleTimeString(),
    });
    try {
      await fetch('/api/printer/response-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tsplStatusByte: byteVal,
          escPosStatusByte: byteVal === 0 ? 0x12 : byteVal,
          lastCapturedFromRealPrinter: {
            hex,
            description: desc,
            timestamp: new Date().toLocaleTimeString(),
            source: 'Manual Calibration',
          },
        }),
      });
      if (onRefreshServer) onRefreshServer();
    } catch {}
  };

  const handleToggleServerBluetooth = async () => {
    setIsTogglingServerBt(true);
    try {
      const action = serverState?.isBluetoothRunning ? 'stop' : 'start';
      await fetch('/api/printer/bluetooth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (onRefreshServer) onRefreshServer();
    } catch {}
    finally {
      setIsTogglingServerBt(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getVisualizerTitleClass = () => {
    switch (titleSize) {
      case 'small':
        return 'text-xs font-bold leading-tight';
      case 'standard':
        return 'text-sm font-black leading-tight';
      case 'large':
        return 'text-base font-black leading-tight';
      case 'xlarge':
        return 'text-lg font-black tracking-tight leading-none';
      default:
        return 'text-sm font-black leading-tight';
    }
  };

  const getVisualizerDetailClass = () => {
    switch (detailSize) {
      case 'compact':
        return 'text-[8px] font-medium leading-tight';
      case 'standard':
        return 'text-[10px] font-semibold leading-tight';
      case 'large':
        return 'text-[11px] font-bold leading-tight';
      default:
        return 'text-[9px] font-medium leading-tight';
    }
  };

  // Preview QR Data
  const previewQrValue =
    designMode === 'codi-pack'
      ? packQr
      : designMode === 'shipping'
      ? shipTrackingNo
      : customQr;
  const qrSvg = includeQr ? generateQrSvg(previewQrValue || 'POLYGON', 120) : '';

  return (
    <div className="space-y-8">
      {/* =========================================================================
          CARD 1: 50×30MM THERMAL PRINT & QR STUDIO (PHYSICAL XP-365B)
          ========================================================================= */}
      <section className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-blue-500/30 shadow-2xl space-y-6 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
        {/* Card 1 Header: Physical Printer Connection */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                btState.isConnected
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              }`}
            >
              <Printer className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-blue-600 text-white">
                  CARD 1
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  50mm × 30mm Print &amp; QR Studio (XP-365B Physical)
                </h3>
                {btState.isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Connected: {btState.deviceName || 'XP-365B'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                    <WifiOff className="w-3 h-3" />
                    <span>Printer Not Connected</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Connect your physical XP-365B printer via Chrome Web Bluetooth and print custom 50x30mm thermal stickers
              </p>
            </div>
          </div>

          {/* Connect / Print Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isSupported && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-4 h-4" />
                <span>Use Google Chrome or Edge</span>
              </div>
            )}

            {btState.isConnected ? (
              <>
                <button
                  onClick={handlePrintPhysical}
                  disabled={isPrinting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  <span>{isPrinting ? `Printing (${printProgress}%)...` : 'Print to XP-365B Now'}</span>
                </button>

                <button
                  onClick={handleFeedOneLabel}
                  disabled={isFeeding}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs transition-all cursor-pointer"
                  title="Feed 1 label forward"
                >
                  {isFeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Form Feed'}
                </button>

                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting || !isSupported}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                <span>Connect Bluetooth Printer (Chrome)</span>
              </button>
            )}

            <button
              onClick={handleSimulateFeed}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Label</span>
            </button>
          </div>
        </div>

        {/* Real Hardware Response Inspection Bar */}
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Actual XP-365B Response:</span>
            <span className="font-mono px-2 py-0.5 rounded-md font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {capturedResponse?.hex || '0x00'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {capturedResponse?.description || 'Printer Normal / Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQueryStatus('tspl')}
              disabled={isQueryingStatus || !btState.isConnected}
              className="px-2.5 py-1 rounded-xl font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all cursor-pointer disabled:opacity-40"
              title="Send ~@ command"
            >
              {isQueryingStatus ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
              Query Status (~@)
            </button>
            <button
              onClick={() => handleQueryStatus('tspl_detailed')}
              disabled={isQueryingStatus || !btState.isConnected}
              className="px-2.5 py-1 rounded-xl font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-all cursor-pointer disabled:opacity-40"
              title="Send ~!@ command"
            >
              Query Error (~!@)
            </button>
          </div>
        </div>

        {/* 50x30 Layout Adjustment Controls Bar (Addresses: "adjust text side, no need QR") */}
        <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Toggle 1: Include QR Code */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">QR Code Mode:</span>
              <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setIncludeQr(true)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    includeQr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>With QR Code</span>
                </button>
                <button
                  onClick={() => setIncludeQr(false)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    !includeQr
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Print text only across full 50mm width without QR code"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Text Only (No QR)</span>
                </button>
              </div>
            </div>

            {/* Toggle 2: Text Side Adjustment (only when QR is enabled) */}
            {includeQr && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">Text Side:</span>
                <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setTextSide('left')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      textSide === 'left'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <AlignLeft className="w-3 h-3" />
                    <span>Text Left / QR Right</span>
                  </button>
                  <button
                    onClick={() => setTextSide('right')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      textSide === 'right'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <AlignRight className="w-3 h-3" />
                    <span>QR Left / Text Right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setDesignMode('four-rows')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-black ${
                designMode === 'four-rows' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              4 Rows (IP &amp; Port)
            </button>
            <button
              onClick={() => setDesignMode('simple-ip')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                designMode === 'simple-ip' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Single Line
            </button>
            <button
              onClick={() => setDesignMode('custom-free')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                designMode === 'custom-free' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Full Details
            </button>
            <button
              onClick={() => setDesignMode('codi-pack')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                designMode === 'codi-pack' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Codi Net Pack
            </button>
            <button
              onClick={() => setDesignMode('shipping')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                designMode === 'shipping' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Shipping
            </button>
            <button
              onClick={() => {
                setDesignMode('raw-tspl');
                if (!rawTsplText) setRawTsplText(generateCurrentTspl());
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                designMode === 'raw-tspl' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Raw TSPL
            </button>
          </div>
        </div>

        {/* Text Size Adjustment Toolbar (Addresses: "can adjust text size as well") */}
        {designMode !== 'simple-ip' && designMode !== 'four-rows' && (
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Title Text Size:</span>
              <div className="flex items-center p-0.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  onClick={() => setTitleSize('small')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    titleSize === 'small' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Small (F2)
                </button>
                <button
                  onClick={() => setTitleSize('standard')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    titleSize === 'standard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Standard (F3)
                </button>
                <button
                  onClick={() => setTitleSize('large')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    titleSize === 'large' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Large (F4)
                </button>
                <button
                  onClick={() => setTitleSize('xlarge')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    titleSize === 'xlarge' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  2x Bold
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Details Text Size:</span>
              <div className="flex items-center p-0.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  onClick={() => setDetailSize('compact')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    detailSize === 'compact' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Compact (F1)
                </button>
                <button
                  onClick={() => setDetailSize('standard')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    detailSize === 'standard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Standard (F2)
                </button>
                <button
                  onClick={() => setDetailSize('large')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    detailSize === 'large' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Large (F3)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card 1 Main Grid: Inputs Form (Left) & Real-Time 50x30 Visualizer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Form */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* MODE 00: 4-ROW FORMAT (IP Address / 192.168.8.30 / PORT / 33581) */}
            {designMode === 'four-rows' && (
              <div className="space-y-4 text-xs">
                {/* Notice / Helper banner */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-[11px] font-bold">
                  <span>4-Row Thermal Format calibrated for 50×30mm roll</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">400×240 dots</span>
                </div>

                {/* Section 1: Row 1 & Row 2 (IP Section) */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Top Group (Header &amp; IP Value)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Row 1 &amp; Row 2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Row 1 (Header Label):
                      </label>
                      <input
                        type="text"
                        value={row1}
                        onChange={(e) => setRow1(e.target.value)}
                        placeholder="IP Address"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Row 2 (IP / Value):
                      </label>
                      <input
                        type="text"
                        value={row2}
                        onChange={(e) => setRow2(e.target.value)}
                        placeholder="192.168.8.30"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Row 3 & Row 4 (Port Section) */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Bottom Group (Header &amp; Port Value)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Row 3 &amp; Row 4</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Row 3 (Header Label):
                      </label>
                      <input
                        type="text"
                        value={row3}
                        onChange={(e) => setRow3(e.target.value)}
                        placeholder="PORT"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Row 4 (Port / Value):
                      </label>
                      <input
                        type="text"
                        value={row4}
                        onChange={(e) => setRow4(e.target.value)}
                        placeholder="33581"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-black text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 1-Click Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setRow1('IP Address');
                        setRow2('192.168.8.30');
                        setRow3('PORT');
                        setRow4('33581');
                      }}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-all cursor-pointer"
                    >
                      Scale (192.168.8.30:33581)
                    </button>
                    <button
                      onClick={() => {
                        setRow1('IP Address');
                        setRow2('192.168.8.101');
                        setRow3('PORT');
                        setRow4('33582');
                      }}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 transition-all cursor-pointer"
                    >
                      Printer Hub (192.168.8.101:33582)
                    </button>
                    <button
                      onClick={() => {
                        setRow1('GREETING');
                        setRow2('Hello World');
                        setRow3('DEVICE');
                        setRow4('XP-365B Ready');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 transition-all cursor-pointer"
                    >
                      Hello World
                    </button>
                    <button
                      onClick={() => {
                        setRow1('LOCAL HOST');
                        setRow2('127.0.0.1');
                        setRow3('BRIDGE PORT');
                        setRow4('9100');
                      }}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-all cursor-pointer"
                    >
                      Bridge (127.0.0.1:9100)
                    </button>
                  </div>
                </div>

                {/* Adjustments: Text Size, Alignment, Divider */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Text Size (5 Levels):
                    </label>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                      <button
                        onClick={() => setFourRowSize('compact')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowSize === 'compact' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Compact
                      </button>
                      <button
                        onClick={() => setFourRowSize('standard')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowSize === 'standard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        onClick={() => setFourRowSize('large')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowSize === 'large' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Large
                      </button>
                      <button
                        onClick={() => setFourRowSize('xlarge')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowSize === 'xlarge' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        X-Large
                      </button>
                      <button
                        onClick={() => setFourRowSize('giant')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowSize === 'giant' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Giant
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Alignment:
                    </label>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setFourRowAlign('center')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowAlign === 'center' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Centered
                      </button>
                      <button
                        onClick={() => setFourRowAlign('left')}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowAlign === 'left' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Left
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Divider Line:
                    </label>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setFourRowDivider(true)}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          fourRowDivider ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        onClick={() => setFourRowDivider(false)}
                        className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-all ${
                          !fourRowDivider ? 'bg-slate-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 0: SIMPLE IP / TEXT ONLY (Addresses: "print ip address text only no need more incres text section") */}
            {designMode === 'simple-ip' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Text to Print (IP Address or Quick Message):
                  </label>
                  <input
                    type="text"
                    value={simpleText}
                    onChange={(e) => setSimpleText(e.target.value)}
                    placeholder="e.g. 192.168.8.30:33581 or Hello World"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* 1-Click Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    1-Click Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSimpleText('192.168.8.30:33581')}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-all cursor-pointer"
                    >
                      192.168.8.30:33581
                    </button>
                    <button
                      onClick={() => setSimpleText('Hello World')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 transition-all cursor-pointer"
                    >
                      Hello World
                    </button>
                    <button
                      onClick={() => setSimpleText('192.168.8.101:33582')}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 transition-all cursor-pointer"
                    >
                      192.168.8.101:33582
                    </button>
                    <button
                      onClick={() => setSimpleText('XP-365B OK')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-all cursor-pointer"
                    >
                      XP-365B OK
                    </button>
                  </div>
                </div>

                {/* Text Size & Alignment Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Text Size:
                    </label>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setSimpleTextSize('normal')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextSize === 'normal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => setSimpleTextSize('medium')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextSize === 'medium' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => setSimpleTextSize('big')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextSize === 'big' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Big Bold
                      </button>
                      <button
                        onClick={() => setSimpleTextSize('huge')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextSize === 'huge' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Huge
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Alignment:
                    </label>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setSimpleTextAlign('center')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextAlign === 'center' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Centered
                      </button>
                      <button
                        onClick={() => setSimpleTextAlign('left')}
                        className={`flex-1 py-1 rounded-lg cursor-pointer transition-all ${
                          simpleTextAlign === 'left' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Left
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {designMode === 'custom-free' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Header / Title (Bold Big)
                    </label>
                    <input
                      type="text"
                      value={customHeader}
                      onChange={(e) => setCustomHeader(e.target.value)}
                      placeholder="e.g. APEX PACK 5030"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  {includeQr && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        QR Code Content / URL
                      </label>
                      <input
                        type="text"
                        value={customQr}
                        onChange={(e) => setCustomQr(e.target.value)}
                        placeholder="e.g. ORD-9921 or URL"
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Detail Line 1
                  </label>
                  <input
                    type="text"
                    value={customLine1}
                    onChange={(e) => setCustomLine1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Detail Line 2
                    </label>
                    <input
                      type="text"
                      value={customLine2}
                      onChange={(e) => setCustomLine2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Detail Line 3
                    </label>
                    <input
                      type="text"
                      value={customLine3}
                      onChange={(e) => setCustomLine3(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Footer Banner
                  </label>
                  <input
                    type="text"
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            )}

            {designMode === 'codi-pack' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Order Number
                    </label>
                    <input
                      type="text"
                      value={packOrderNo}
                      onChange={(e) => {
                        setPackOrderNo(e.target.value);
                        setPackQr(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Hub / Distribution Center
                    </label>
                    <input
                      type="text"
                      value={packCategory}
                      onChange={(e) => setPackCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Order Type
                    </label>
                    <input
                      type="text"
                      value={packType}
                      onChange={(e) => setPackType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      value={packDate}
                      onChange={(e) => setPackDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Step
                    </label>
                    <input
                      type="text"
                      value={packStepIndex}
                      onChange={(e) => setPackStepIndex(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Step Label / Box Description
                  </label>
                  <input
                    type="text"
                    value={packStepLabel}
                    onChange={(e) => setPackStepLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            )}

            {designMode === 'shipping' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Tracking / Waybill No
                    </label>
                    <input
                      type="text"
                      value={shipTrackingNo}
                      onChange={(e) => setShipTrackingNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Route
                    </label>
                    <input
                      type="text"
                      value={shipRoute}
                      onChange={(e) => setShipRoute(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Sender &rarr; Receiver
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={shipSender}
                      onChange={(e) => setShipSender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={shipReceiver}
                      onChange={(e) => setShipReceiver(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {designMode === 'raw-tspl' && (
              <div className="space-y-2 text-xs">
                <textarea
                  value={rawTsplText}
                  onChange={(e) => setRawTsplText(e.target.value)}
                  placeholder="SIZE 50 mm, 30 mm..."
                  rows={7}
                  className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Utility Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => copyToClipboard(generateCurrentTspl(), 'tspl')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                {copiedField === 'tspl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy TSPL</span>
              </button>
              <span className="text-[11px] font-mono text-slate-400">
                Calibrated: 400 dots × 240 dots (203 DPI)
              </span>
            </div>
          </div>

          {/* Right Visualizer: 50mm x 30mm Real-Time Label */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-tight text-slate-700 dark:text-slate-300">
                  50mm × 30mm Live Sticker
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {includeQr ? `QR: ${textSide.toUpperCase()} TEXT` : 'NO QR (FULL WIDTH)'}
                </span>
              </div>

              {/* Printer Slot Ejection Emulation */}
              <div className="w-full flex items-center justify-center mb-1">
                <div className="w-56 h-2 bg-slate-800 rounded-full shadow-inner border border-slate-700" />
              </div>

              {/* Physical Sticker Card (5:3 Aspect Ratio) */}
              <div
                className={`w-full bg-white text-black p-3.5 rounded-xl shadow-2xl border border-neutral-300 transition-all duration-300 font-sans select-none relative overflow-hidden ${
                  isFeedingAnimation ? 'animate-bounce translate-y-2' : ''
                }`}
                style={{
                  aspectRatio: '50 / 30',
                  boxShadow: '0 16px 28px -8px rgba(0,0,0,0.35), 0 0 1px 1px rgba(0,0,0,0.1)',
                }}
              >
                <div className="absolute top-1.5 right-2 text-[7px] font-mono uppercase tracking-widest text-neutral-400 font-bold opacity-60">
                  50×30 TSPL
                </div>

                <div className="h-full flex flex-col justify-between">
                  {designMode === 'four-rows' ? (
                    <div className="h-full w-full relative flex flex-col justify-center">
                      <div className="text-[7px] font-mono text-neutral-400 absolute bottom-0 right-0 opacity-60 pointer-events-none">
                        50×30 MM
                      </div>
                      <div className={`w-full flex flex-col justify-center my-auto py-1 ${fourRowAlign === 'center' ? 'text-center' : 'text-left pl-3'}`}>
                        {/* Top Group: Row 1 & Row 2 (IP Section) */}
                        <div className="space-y-0.5">
                          <div className={`font-black uppercase tracking-wider text-neutral-500 truncate ${
                            fourRowSize === 'compact' ? 'text-[7.5px]' :
                            fourRowSize === 'standard' ? 'text-[8.5px]' :
                            fourRowSize === 'large' ? 'text-[9.5px]' :
                            fourRowSize === 'xlarge' ? 'text-[10.5px]' : 'text-xs'
                          }`}>
                            {row1 || 'IP Address'}
                          </div>
                          <div className={`font-mono font-black text-neutral-950 truncate tracking-tight ${
                            fourRowSize === 'compact' ? 'text-xs' :
                            fourRowSize === 'standard' ? 'text-sm sm:text-base font-bold' :
                            fourRowSize === 'large' ? 'text-base sm:text-lg font-black' :
                            fourRowSize === 'xlarge' ? 'text-lg sm:text-xl font-black' : 'text-xl sm:text-2xl font-black tracking-tighter'
                          }`}>
                            {row2 || '192.168.8.30'}
                          </div>
                        </div>

                        {/* Optional Divider Line */}
                        {fourRowDivider && (
                          <div className="w-full border-b border-neutral-300 my-1" />
                        )}

                        {/* Bottom Group: Row 3 & Row 4 (Port Section) */}
                        <div className="space-y-0.5">
                          <div className={`font-black uppercase tracking-wider text-neutral-500 truncate ${
                            fourRowSize === 'compact' ? 'text-[7.5px]' :
                            fourRowSize === 'standard' ? 'text-[8.5px]' :
                            fourRowSize === 'large' ? 'text-[9.5px]' :
                            fourRowSize === 'xlarge' ? 'text-[10.5px]' : 'text-xs'
                          }`}>
                            {row3 || 'PORT'}
                          </div>
                          <div className={`font-mono font-black text-neutral-950 truncate tracking-tight ${
                            fourRowSize === 'compact' ? 'text-xs' :
                            fourRowSize === 'standard' ? 'text-sm sm:text-base font-bold' :
                            fourRowSize === 'large' ? 'text-base sm:text-lg font-black' :
                            fourRowSize === 'xlarge' ? 'text-lg sm:text-xl font-black' : 'text-xl sm:text-2xl font-black tracking-tighter'
                          }`}>
                            {row4 || '33581'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : designMode === 'simple-ip' ? (
                    <div className="h-full w-full flex flex-col justify-between">
                      <div className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 font-bold opacity-60">
                        SIMPLE TEXT / IP
                      </div>
                      <div
                        className={`w-full flex items-center ${
                          simpleTextAlign === 'center'
                            ? 'justify-center text-center'
                            : 'justify-start text-left pl-2'
                        }`}
                      >
                        <span
                          className={`font-mono font-black text-neutral-950 truncate select-text ${getSimpleVisualizerClass(
                            simpleTextSize
                          )}`}
                        >
                          {simpleText || '192.168.8.30:33581'}
                        </span>
                      </div>
                      <div className="text-[7px] font-mono text-neutral-400 text-right opacity-60">
                        50×30 MM
                      </div>
                    </div>
                  ) : includeQr ? (
                    /* Layout With QR Code */
                    <div className={`flex items-start justify-between gap-2 ${textSide === 'right' ? 'flex-row-reverse' : ''}`}>
                      {/* Text Column */}
                      <div className="space-y-0.5 max-w-[62%]">
                        <div className={`${getVisualizerTitleClass()} text-neutral-950 truncate`}>
                          {designMode === 'codi-pack' ? packOrderNo : designMode === 'shipping' ? shipTrackingNo : customHeader}
                        </div>
                        <div className={`${getVisualizerDetailClass()} text-neutral-800 truncate`}>
                          {designMode === 'codi-pack' ? packCategory : designMode === 'shipping' ? `FROM: ${shipSender}` : customLine1}
                        </div>
                        <div className={`${getVisualizerDetailClass()} text-neutral-700 truncate`}>
                          {designMode === 'codi-pack' ? packType : designMode === 'shipping' ? `TO: ${shipReceiver}` : customLine2}
                        </div>
                        <div className={`${getVisualizerDetailClass()} text-neutral-700 truncate font-mono`}>
                          {designMode === 'codi-pack' ? `${packDate} • ${packTimeSlot}` : designMode === 'shipping' ? shipRoute : customLine3}
                        </div>
                      </div>

                      {/* QR Box */}
                      <div className="flex flex-col items-center justify-center p-0.5 bg-white border border-neutral-300 rounded shadow-xs shrink-0">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16"
                          dangerouslySetInnerHTML={{ __html: qrSvg }}
                        />
                        <span className="text-[7px] font-mono text-neutral-600 mt-0.5 truncate max-w-[60px]">
                          {previewQrValue}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Layout WITHOUT QR Code (Full Width) */
                    <div className="space-y-1">
                      <div className={`${getVisualizerTitleClass()} text-neutral-950 truncate`}>
                        {designMode === 'codi-pack' ? packOrderNo : designMode === 'shipping' ? shipTrackingNo : customHeader}
                      </div>
                      <div className={`${getVisualizerDetailClass()} text-neutral-800 truncate`}>
                        {designMode === 'codi-pack' ? packCategory : designMode === 'shipping' ? `FROM: ${shipSender}` : customLine1}
                      </div>
                      <div className={`${getVisualizerDetailClass()} text-neutral-700 truncate`}>
                        {designMode === 'codi-pack' ? `${packType} • ${packStepIndex}` : designMode === 'shipping' ? `TO: ${shipReceiver}` : customLine2}
                      </div>
                      <div className={`${getVisualizerDetailClass()} text-neutral-600 truncate font-mono`}>
                        {designMode === 'codi-pack' ? `${packDate}   ${packTimeSlot}` : designMode === 'shipping' ? `ROUTE: ${shipRoute}` : customLine3}
                      </div>
                    </div>
                  )}

                  {/* Bottom Divider & Footer */}
                  <div>
                    <div className="w-full border-t border-neutral-900 my-0.5" />
                    <div className="flex items-center justify-between text-neutral-900">
                      <span className="text-[9px] font-black uppercase truncate">
                        {designMode === 'codi-pack' ? packStepLabel : designMode === 'shipping' ? 'POLYGON EXPRESS' : customFooter}
                      </span>
                      <span className="text-[8px] font-mono text-neutral-500 shrink-0 ml-1">
                        50×30 MM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {lastPrintedAt && (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center">
                Last Print Triggered: {lastPrintedAt}
              </div>
            )}
          </div>
        </div>

        {/* Live Bluetooth Logs Feed in Card 1 */}
        <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs max-h-40 overflow-y-auto space-y-1 border border-slate-800">
          {btLogs.length > 0 ? (
            btLogs.slice(-10).map((l) => (
              <div key={l.id} className="flex items-start gap-2">
                <span className="text-slate-500">[{l.timestamp}]</span>
                <span className={l.type === 'success' ? 'text-emerald-400 font-bold' : l.type === 'error' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {l.message}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-500">Waiting for printer Bluetooth activity...</div>
          )}
        </div>
      </section>

      {/* =========================================================================
          CARD 2: ACT AS REAL PRINTER (HARDWARE EMULATION & MOBILE PHONE RECEIVER)
          ========================================================================= */}
      <section className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/30 shadow-2xl space-y-6 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        {/* Card 2 Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                serverState?.isBluetoothRunning
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              <Radio className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-600 text-white">
                  CARD 2
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Act as Real Printer (Napru Hashini Printer - Codi Net Receiver)
                </h3>
                {serverState?.isBluetoothRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Broadcasting: {serverState?.bluetoothDeviceName || "Napru Hashini Printer"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <WifiOff className="w-3 h-3" />
                    <span>Broadcast Inactive</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Laptop broadcasts as 'Napru Hashini Printer' over Bluetooth LE (ISSC 49535343 &amp; XP-365B FFE0) and answers phone with real 0x00 ACK
              </p>
            </div>
          </div>

          {/* Broadcast Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleServerBluetooth}
              disabled={isTogglingServerBt}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-md ${
                serverState?.isBluetoothRunning
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
              }`}
            >
              {isTogglingServerBt ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              <span>{serverState?.isBluetoothRunning ? 'Stop Phone Broadcast' : 'Start Phone Broadcast'}</span>
            </button>
          </div>
        </div>

        {/* Real Printer Response Mirroring Engine */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Response Sent to Phone
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                0x{mirroredStatusByte.toString(16).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                GATT READ &amp; NOTIFY
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {mirroredStatusByte === 0 ? 'Printer Ready / Normal (No Error)' : 'ESC/POS Online'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Mobile App Impact (Codi Net)
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Order State Protected (No Revert)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Phone checks printer status via ~@ or notify. Because laptop returns 0x00, phone confirms print success!
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Calibration Presets
            </span>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => handleSetMirroredByte(0x00, 'Printer Normal / Ready (TSPL Baseline)')}
                className={`flex-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  mirroredStatusByte === 0
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                0x00 (TSPL Ready)
              </button>
              <button
                onClick={() => handleSetMirroredByte(0x12, 'ESC/POS Online Ready')}
                className={`flex-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  mirroredStatusByte === 0x12
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                0x12 (ESC/POS)
              </button>
            </div>
          </div>
        </div>

        {/* Pairing Instructions for Codi Net */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">1. Bluetooth ON</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Turn ON Bluetooth on your phone</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">2. Scan in Codi Net</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tap Select Printer &rarr; Scan</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">3. Select Laptop</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pick {serverState?.bluetoothDeviceName || "Napru Hashini Printer"}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">4. Tap Print</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Phone gets 0x00 ACK &amp; succeeds!</span>
          </div>
        </div>
      </section>
    </div>
  );
};
