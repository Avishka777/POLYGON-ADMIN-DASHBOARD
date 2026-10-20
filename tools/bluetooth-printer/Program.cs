using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using Windows.Foundation;
using Windows.Storage.Streams;
using Windows.Security.Cryptography;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Devices.Bluetooth.Advertisement;

namespace Polygon.BluetoothPrinter {
    class Program {
        // Standard Thermal Printer / Transparent UART Service & Characteristic UUIDs
        // Exact Xprinter XP-365B Thermal Printer BLE Service & Characteristic UUIDs (FFE0 / FFE1)
        private static readonly Guid PRINTER_SERVICE_UUID = new Guid("0000ffe0-0000-1000-8000-00805f9b34fb");
        private static readonly Guid PRINTER_WRITE_CHAR_UUID = new Guid("0000ffe1-0000-1000-8000-00805f9b34fb");

        private static GattServiceProvider _provider;
        private static GattLocalCharacteristic _characteristic;
        private static BluetoothLEAdvertisementPublisher _advPublisher;
        private static StringBuilder _tsplBuffer = new StringBuilder();
        private static readonly object _lockObj = new object();
        private static Timer _flushTimer;

        // Dynamic Real Printer Response Mirroring
        // Default: 0x00 (TSPL Ready: head closed, paper present, normal idle)
        private static byte _activeTsplStatusByte = 0x00;
        private static byte _activeEscPosStatusByte = 0x12; // ESC/POS online status (bits 1 & 4 high)

        static void Main(string[] args) {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("==========================================================");
            Console.WriteLine("  POLYGON VIRTUAL BLUETOOTH THERMAL PRINTER (TSPL 50x30)  ");
            Console.WriteLine("  Real Printer Response Mirroring Daemon Active           ");
            Console.WriteLine("==========================================================");

            int dashboardPort = 3000;
            int customPort;
            if (args.Length > 0 && int.TryParse(args[0], out customPort)) {
                dashboardPort = customPort;
            }

            try {
                // 1. Create GATT Service Provider
                Console.WriteLine("[BT] Initializing GATT Service Provider (" + PRINTER_SERVICE_UUID + ")...");
                var op = GattServiceProvider.CreateAsync(PRINTER_SERVICE_UUID);
                while (op.Status == AsyncStatus.Started) Thread.Sleep(25);
                var res = op.GetResults();

                if (res.ServiceProvider == null) {
                    Console.WriteLine("[BT ERROR] Failed to create GATT service provider: " + res.Error);
                    return;
                }
                _provider = res.ServiceProvider;

                // 2. Add Multi-functional Characteristic: Write, WriteWithoutResponse, Read, Notify
                // Allows mobile drivers to read status and receive real-time ACK notifications
                var charParams = new GattLocalCharacteristicParameters();
                charParams.CharacteristicProperties = GattCharacteristicProperties.Write |
                                                      GattCharacteristicProperties.WriteWithoutResponse |
                                                      GattCharacteristicProperties.Read |
                                                      GattCharacteristicProperties.Notify;
                charParams.UserDescription = "TSPL Label Channel & Status ACK";
                charParams.WriteProtectionLevel = GattProtectionLevel.Plain;
                charParams.ReadProtectionLevel = GattProtectionLevel.Plain;

                var charOp = _provider.Service.CreateCharacteristicAsync(PRINTER_WRITE_CHAR_UUID, charParams);
                while (charOp.Status == AsyncStatus.Started) Thread.Sleep(25);
                var charRes = charOp.GetResults();

                if (charRes.Characteristic == null) {
                    Console.WriteLine("[BT ERROR] Failed to create characteristic: " + charRes.Error);
                    return;
                }

                _characteristic = charRes.Characteristic;

                // Handle Writes from phone / other driver
                _characteristic.WriteRequested += (sender, eventArgs) => {
                    OnDataWriteRequested(eventArgs, dashboardPort);
                };

                // Handle Reads from phone / driver (returns real printer status byte: 0x00 Ready)
                _characteristic.ReadRequested += (sender, eventArgs) => {
                    OnDataReadRequested(eventArgs);
                };

                // Track notification subscribers
                _characteristic.SubscribedClientsChanged += (sender, eventArgs) => {
                    Console.WriteLine("[BT SUBSCRIBERS] Connected client subscription changed: " + _characteristic.SubscribedClients.Count + " client(s) subscribed.");
                };

                // 3. Start Advertising GATT Service
                var advParams = new GattServiceProviderAdvertisingParameters();
                advParams.IsConnectable = true;
                advParams.IsDiscoverable = true;
                _provider.StartAdvertising(advParams);

                // 4. Start Complementary BLE Advertisement with Local Name
                try {
                    _advPublisher = new BluetoothLEAdvertisementPublisher();
                    _advPublisher.Advertisement.LocalName = "Napru Hashini";
                    _advPublisher.Start();
                    Console.WriteLine("[BT SUCCESS] Custom LocalName advertised: 'Napru Hashini'");
                } catch (Exception ex) {
                    Console.WriteLine("[BT NOTE] Optional adv publisher: " + ex.Message);
                }

                Console.WriteLine("[BT SUCCESS] Bluetooth Printer 'Napru Hashini Printer' is active and broadcasting!");
                Console.WriteLine("[BT] Device Name: Napru Hashini Printer (" + Environment.MachineName + ")");
                Console.WriteLine("[BT] Service UUID: " + PRINTER_SERVICE_UUID);
                Console.WriteLine("[BT] Characteristic: " + PRINTER_WRITE_CHAR_UUID);
                Console.WriteLine("[BT] Mirrored Status Byte: 0x" + _activeTsplStatusByte.ToString("X2") + " (Printer Ready / Paper OK)");
                Console.WriteLine("[BT] Target Dashboard: http://localhost:" + dashboardPort + "/api/printer/print");
                Console.WriteLine("----------------------------------------------------------");

                // Start periodic response profile poller from dashboard
                var profileTimer = new Timer((s) => {
                    PollResponseProfile(dashboardPort);
                }, null, 5000, 10000);

                // Keep process alive
                var exitEvent = new ManualResetEvent(false);
                Console.CancelKeyPress += (s, e) => {
                    e.Cancel = true;
                    exitEvent.Set();
                };
                exitEvent.WaitOne();

                profileTimer.Dispose();

                // Cleanup on exit
                Console.WriteLine("[BT] Stopping Bluetooth broadcasts...");
                if (_advPublisher != null) {
                    try { _advPublisher.Stop(); } catch { }
                }
                if (_provider != null) {
                    try { _provider.StopAdvertising(); } catch { }
                }
            } catch (Exception ex) {
                Console.WriteLine("[BT FATAL ERROR] " + ex.ToString());
            }
        }

        private static void OnDataReadRequested(GattReadRequestedEventArgs args) {
            var deferral = args.GetDeferral();
            try {
                var reqOp = args.GetRequestAsync();
                reqOp.Completed = new AsyncOperationCompletedHandler<GattReadRequest>((info, status) => {
                    try {
                        if (status == AsyncStatus.Completed) {
                            var request = info.GetResults();
                            if (request != null) {
                                var writer = new DataWriter();
                                writer.WriteByte(_activeTsplStatusByte); // 0x00 = Ready
                                request.RespondWithValue(writer.DetachBuffer());
                                Console.WriteLine("[BT READ] Returned real printer status (0x" + _activeTsplStatusByte.ToString("X2") + ") to client");
                            }
                        }
                    } catch (Exception ex) {
                        Console.WriteLine("[BT READ ERROR] " + ex.Message);
                    } finally {
                        deferral.Complete();
                    }
                });
            } catch (Exception ex) {
                Console.WriteLine("[BT READ ERROR] " + ex.Message);
                deferral.Complete();
            }
        }

        private static void OnDataWriteRequested(GattWriteRequestedEventArgs args, int dashboardPort) {
            var deferral = args.GetDeferral();
            try {
                var reqOp = args.GetRequestAsync();
                reqOp.Completed = new AsyncOperationCompletedHandler<GattWriteRequest>((info, status) => {
                    try {
                        if (status == AsyncStatus.Completed) {
                            var request = info.GetResults();
                            if (request != null && request.Value != null && request.Value.Length > 0) {
                                byte[] bytes = new byte[request.Value.Length];
                                using (var reader = DataReader.FromBuffer(request.Value)) {
                                    reader.ReadBytes(bytes);
                                }

                                Console.WriteLine("[BT WRITE RECEIVED] " + bytes.Length + " bytes | Option: " + request.Option);

                                // Check if this write is a printer status inquiry
                                bool isTsplStatusQuery = (bytes.Length == 2 && bytes[0] == 0x7E && bytes[1] == 0x40) ||
                                                        (bytes.Length == 3 && bytes[0] == 0x7E && bytes[1] == 0x21 && bytes[2] == 0x40);
                                bool isEscPosStatusQuery = (bytes.Length >= 3 && bytes[0] == 0x10 && bytes[1] == 0x04);

                                string chunk = Encoding.UTF8.GetString(bytes);
                                lock (_lockObj) {
                                    _tsplBuffer.Append(chunk);

                                    // Reset or set flush timer
                                    if (_flushTimer != null) {
                                        _flushTimer.Dispose();
                                    }
                                    _flushTimer = new Timer((state) => {
                                        FlushBuffer(dashboardPort);
                                    }, null, 600, Timeout.Infinite);

                                    // If chunk contains PRINT command, flush immediately
                                    if (chunk.IndexOf("PRINT", StringComparison.OrdinalIgnoreCase) >= 0) {
                                        FlushBuffer(dashboardPort);
                                    }
                                }

                                // 1. Send WriteResponse if requested
                                if (request.Option == GattWriteOption.WriteWithResponse) {
                                    request.Respond();
                                    Console.WriteLine("[BT RESPOND] Sent WriteResponse to phone");
                                }

                                // 2. Send GATT Notification with real printer response ACK
                                if (isTsplStatusQuery || isEscPosStatusQuery || chunk.IndexOf("PRINT", StringComparison.OrdinalIgnoreCase) >= 0) {
                                    byte respByte = isEscPosStatusQuery ? _activeEscPosStatusByte : _activeTsplStatusByte;
                                    NotifyPrinterStatus(respByte);
                                }
                            } else {
                                if (request != null && request.Option == GattWriteOption.WriteWithResponse) {
                                    request.Respond();
                                }
                            }
                        } else {
                            Console.WriteLine("[BT WRITE ERROR] GetRequestAsync status: " + status);
                        }
                    } catch (Exception ex) {
                        Console.WriteLine("[BT INNER WRITE ERROR] " + ex.Message);
                    } finally {
                        deferral.Complete();
                    }
                });
            } catch (Exception ex) {
                Console.WriteLine("[BT WRITE ERROR] " + ex.Message);
                deferral.Complete();
            }
        }

        private static void NotifyPrinterStatus(byte statusByte) {
            try {
                if (_characteristic != null && _characteristic.SubscribedClients != null && _characteristic.SubscribedClients.Count > 0) {
                    var writer = new DataWriter();
                    writer.WriteByte(statusByte);
                    _characteristic.NotifyValueAsync(writer.DetachBuffer());
                    Console.WriteLine("[BT NOTIFY REAL RESPONSE] Sent 0x" + statusByte.ToString("X2") + " to " + _characteristic.SubscribedClients.Count + " client(s)");
                }
            } catch (Exception ex) {
                Console.WriteLine("[BT NOTIFY WARNING] " + ex.Message);
            }
        }

        private static void FlushBuffer(int dashboardPort) {
            string tspl = null;
            lock (_lockObj) {
                if (_tsplBuffer.Length == 0) return;
                tspl = _tsplBuffer.ToString();
                _tsplBuffer.Clear();
                if (_flushTimer != null) {
                    _flushTimer.Dispose();
                    _flushTimer = null;
                }
            }

            if (string.IsNullOrWhiteSpace(tspl)) return;

            Console.WriteLine("[BT RECEIVED] Captured " + tspl.Length + " bytes of TSPL label data from phone!");

            // Send notification to indicate print finished
            NotifyPrinterStatus(_activeTsplStatusByte);

            // Forward to Dashboard API
            ThreadPool.QueueUserWorkItem((s) => {
                PostToDashboard(tspl, dashboardPort);
            });
        }

        private static void PostToDashboard(string tspl, int port) {
            try {
                string url = "http://localhost:" + port + "/api/printer/print";
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = "POST";
                req.ContentType = "application/json";
                req.Timeout = 4000;

                string json = "{\"tspl\":" + JsonEscape(tspl) + ",\"source\":\"bluetooth\"}";
                byte[] body = Encoding.UTF8.GetBytes(json);
                req.ContentLength = body.Length;

                using (Stream stream = req.GetRequestStream()) {
                    stream.Write(body, 0, body.Length);
                }

                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) {
                    Console.WriteLine("[BT DISPATCH] Label forwarded to Dashboard UI -> Status: " + resp.StatusCode);
                }
            } catch (Exception ex) {
                Console.WriteLine("[BT DISPATCH WARNING] Could not forward to Dashboard: " + ex.Message);
            }
        }

        private static void PollResponseProfile(int port) {
            try {
                string url = "http://localhost:" + port + "/api/printer/response-profile";
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = "GET";
                req.Timeout = 2000;

                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) {
                    using (StreamReader reader = new StreamReader(resp.GetResponseStream())) {
                        string json = reader.ReadToEnd();
                        // Parse status byte if updated
                        int idx = json.IndexOf("\"tsplStatusByte\":");
                        if (idx >= 0) {
                            int start = idx + 17;
                            int end = json.IndexOfAny(new char[] { ',', '}', ' ' }, start);
                            if (end > start) {
                                string valStr = json.Substring(start, end - start).Trim();
                                byte b;
                                if (byte.TryParse(valStr, out b)) {
                                    _activeTsplStatusByte = b;
                                }
                            }
                        }
                    }
                }
            } catch {
                // Ignore background polling errors
            }
        }

        private static string JsonEscape(string str) {
            if (str == null) return "\"\"";
            StringBuilder sb = new StringBuilder();
            sb.Append('"');
            foreach (char c in str) {
                switch (c) {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32) {
                            sb.AppendFormat("\\u{0:x4}", (int)c);
                        } else {
                            sb.Append(c);
                        }
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }
    }
}
