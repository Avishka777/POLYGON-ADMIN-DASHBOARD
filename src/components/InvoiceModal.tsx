'use client';

import React from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

export interface InvoiceData {
  invoiceNumber: string;
  orderId: number | string;
  environment: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: string;
  timeSlot: string;
  buyerType: string;
  orderStatus: string;
  previousStatus?: string;
  outDate: string;
  items: Array<{
    name: string;
    qty: string;
    price: number;
    packingFee?: number;
  }>;
  subtotal: number;
  packingFee: number;
  serviceFee: number;
  discount: number;
  grandTotal: number;
  paymentType: string;
  issuedBy: string;
  companyHeader: {
    name: string;
    tagline: string;
    taxId: string;
    center: string;
  };
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  isLightTheme?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isLightTheme = false,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return `Rs. ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
      <div
        className={`max-w-2xl w-full rounded-3xl border shadow-2xl flex flex-col overflow-hidden my-6 transition-colors ${
          isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
        }`}
      >
        {/* Top Control Header (Non-printable) */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between print:hidden ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                Order Outed & Invoice Generated
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {invoice.environment}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Codi Net Distribution Invoice • Status: {invoice.orderStatus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="p-8 space-y-8 print:p-0">
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b pb-6 border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                  CODI
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  {invoice.companyHeader.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {invoice.companyHeader.tagline}
              </p>
              <p className="text-[11px] text-slate-400">
                Center: {invoice.companyHeader.center} | Tax ID: {invoice.companyHeader.taxId}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-block">
                TAX INVOICE
              </span>
              <h2 className="text-lg font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Issued Date: {invoice.outDate}
              </p>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1.5">
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">
                Customer Details
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {invoice.customerName}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{invoice.customerAddress}</p>
              <p className="text-slate-500">Phone: {invoice.customerPhone}</p>
            </div>

            <div className="space-y-1.5">
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">
                Distribution & Order Context
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Method:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.deliveryMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{invoice.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer Type / Payment:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {invoice.buyerType} • {invoice.paymentType}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Itemized Order Summary
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 font-bold">Item Description</th>
                  <th className="py-2.5 font-bold text-center">Qty / Weight</th>
                  <th className="py-2.5 font-bold text-right">Price</th>
                  <th className="py-2.5 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium">{item.name}</td>
                    <td className="py-2.5 text-center font-mono">{item.qty}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(item.price)}</td>
                    <td className="py-2.5 text-right font-bold font-mono">
                      {formatCurrency(item.price + (item.packingFee || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* QR Verification Stamp */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                  ✓ Verified Out Order
                </span>
                <span>Scan code to verify authenticity</span>
                <span className="block font-mono text-slate-400">{invoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Totals Box */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Packing & Handling Fee:</span>
                <span className="font-mono">{formatCurrency(invoice.packingFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Distribution Service Fee:</span>
                <span className="font-mono">{formatCurrency(invoice.serviceFee)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discounts Applied:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatCurrency(invoice.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-8 py-3 text-center text-[11px] text-slate-400 border-t ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          Generated by Polygon Mobile App Manager • Codi Net Packing Operations System
        </div>
      </div>
    </div>
  );
};
