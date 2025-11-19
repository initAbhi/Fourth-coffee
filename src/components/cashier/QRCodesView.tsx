"use client";

import { useEffect, useState } from "react";
import { Download, QrCode, Printer, Copy, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";

interface QRCodeData {
  tableId: string;
  tableNumber: string;
  tableSlug: string;
  qrCode: string;
  url: string;
}

export function QRCodesView() {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllQRCodes();
      
      if (response.success && response.data) {
        setQRCodes(response.data);
      } else {
        toast.error(response.error || "Failed to load QR codes");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableNumber.trim()) {
      toast.error("Please enter a table number");
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiClient.createTable({
        tableNumber: newTableNumber.trim(),
        qrSlug: newTableNumber.trim(),
      });

      if (response.success) {
        toast.success(`Table ${newTableNumber} created successfully`);
        setNewTableNumber("");
        setShowAddTable(false);
        await loadQRCodes();
      } else {
        throw new Error(response.error || "Failed to create table");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create table");
    } finally {
      setIsCreating(false);
    }
  };

  const downloadQRCode = (qrCode: QRCodeData) => {
    const link = document.createElement("a");
    link.href = qrCode.qrCode;
    link.download = `QR-${qrCode.tableNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`QR code for ${qrCode.tableNumber} downloaded`);
  };

  const copyURL = (url: string, tableId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(tableId);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const printQRCode = (qrCode: QRCodeData) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${qrCode.tableNumber}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                font-family: Arial, sans-serif;
              }
              h1 {
                margin-bottom: 20px;
                color: #563315;
              }
              img {
                max-width: 400px;
                height: auto;
                border: 2px solid #563315;
                padding: 20px;
                background: white;
              }
              p {
                margin-top: 20px;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <h1>Table ${qrCode.tableNumber}</h1>
            <img src="${qrCode.qrCode}" alt="QR Code" />
            <p>Scan to place an order</p>
            <p>${qrCode.url}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#faf7f0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#563315]/30 border-t-[#563315] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#563315]">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#faf7f0] p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#563315] mb-2 flex items-center gap-3">
              <QrCode size={40} />
              Table QR Codes
            </h1>
            <p className="text-[#563315]/70">
              Generate and download QR codes for each table. Customers scan these to place orders.
            </p>
          </div>
          <Button
            onClick={() => setShowAddTable(true)}
            className="bg-[#563315] hover:bg-[#6d4522] text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Add Table
          </Button>
        </div>

        {/* Add Table Modal */}
        {showAddTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddTable(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#563315]">Add New Table</h2>
                <button
                  onClick={() => setShowAddTable(false)}
                  className="text-[#563315]/60 hover:text-[#563315]"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#563315] mb-2">
                    Table Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., T-05"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="w-full"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateTable();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowAddTable(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTable}
                    disabled={isCreating}
                    className="flex-1 bg-[#563315] hover:bg-[#6d4522]"
                  >
                    {isCreating ? "Creating..." : "Create Table"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* QR Codes Grid */}
        {qrCodes.length === 0 ? (
          <Card className="p-12 text-center">
            <QrCode size={64} className="mx-auto mb-4 text-[#563315]/30" />
            <h3 className="text-xl font-semibold text-[#563315] mb-2">No Tables Found</h3>
            <p className="text-[#563315]/70 mb-4">
              Create your first table to generate QR codes
            </p>
            <Button
              onClick={() => setShowAddTable(true)}
              className="bg-[#563315] hover:bg-[#6d4522] text-white"
            >
              <Plus size={20} className="mr-2" />
              Add First Table
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {qrCodes.map((qrCode) => (
              <Card key={qrCode.tableId} className="p-6 bg-white shadow-lg">
                <div className="text-center">
                  {/* Table Number */}
                  <h3 className="text-2xl font-bold text-[#563315] mb-4">
                    Table {qrCode.tableNumber}
                  </h3>

                  {/* QR Code Image */}
                  <div className="mb-4 flex justify-center">
                    <img
                      src={qrCode.qrCode}
                      alt={`QR Code for ${qrCode.tableNumber}`}
                      className="w-48 h-48 border-2 border-[#563315]/20 rounded-lg p-2 bg-white"
                    />
                  </div>

                  {/* URL Display */}
                  <div className="mb-4 p-2 bg-[#f0ddb6]/30 rounded text-xs text-[#563315]/70 break-all">
                    {qrCode.url}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => copyURL(qrCode.url, qrCode.tableId)}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {copiedId === qrCode.tableId ? (
                        <>
                          <Check size={16} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy URL
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => downloadQRCode(qrCode)}
                      className="w-full bg-[#563315] hover:bg-[#6d4522] text-white flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download QR
                    </Button>

                    <Button
                      onClick={() => printQRCode(qrCode)}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Printer size={16} />
                      Print
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="mt-8 p-6 bg-[#f0ddb6]/30 border-[#563315]/20">
          <h3 className="text-lg font-semibold text-[#563315] mb-2">How to Use</h3>
          <ul className="list-disc list-inside text-[#563315]/70 space-y-1">
            <li>Download or print QR codes for each table</li>
            <li>Place QR codes on tables or table stands</li>
            <li>Customers scan the QR code to access the menu</li>
            <li>Orders are automatically assigned to the correct table</li>
            <li>Each QR code contains a unique table identifier</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}


