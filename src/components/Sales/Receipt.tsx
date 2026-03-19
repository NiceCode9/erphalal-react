import React from "react";

interface ReceiptProps {
  sale: {
    invoice_number: string;
    created_at?: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    cash_received: number;
    change: number;
    user_name?: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, items }, ref) => {
  return (
    <div ref={ref} className="bg-white p-6 mx-auto text-black font-mono text-[12px] leading-tight print:p-4 print:mt-10" style={{ width: "300px" }}>
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-1">POS ERP HALAL</h2>
        <p className="text-[11px] opacity-80 uppercase">TERMINAL KASIR #01</p>
        <p className="text-[10px] italic">*** PEMBAYARAN TUNAI ***</p>
      </div>

      <div className="border-y border-dashed border-black/30 py-3 mb-4 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="font-semibold uppercase">Invoice:</span>
          <span>#{sale.invoice_number.slice(-8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold uppercase">Tanggal:</span>
          <span>{new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold uppercase">Kasir:</span>
          <span className="uppercase">{sale.user_name || "STAF"}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex border-b border-black/20 pb-1 mb-1 font-bold text-[10px] uppercase">
          <span className="flex-1">NAMA ITEM</span>
          <span className="w-8 text-center">QTY</span>
          <span className="w-20 text-right">JUMLAH</span>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="uppercase font-medium text-[11px] mb-0.5">{item.name}</span>
              <div className="flex text-[10px] opacity-80">
                <span className="flex-1 text-gray-600">
                  {item.price.toLocaleString('id-ID')} x {item.quantity}
                </span>
                <span className="w-20 text-right">
                  {item.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-double border-black pt-4 space-y-2 text-[11px]">
        <div className="flex justify-between items-center opacity-70">
          <span>SUBTOTAL</span>
          <span>Rp {sale.subtotal.toLocaleString('id-ID')}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between items-center text-error-600 italic">
            <span>POTONGAN (DISC)</span>
            <span>- Rp {sale.discount.toLocaleString('id-ID')}</span>
          </div>
        )}
        {sale.tax > 0 && (
          <div className="flex justify-between items-center opacity-70">
            <span>PAJAK (PPN)</span>
            <span>Rp {sale.tax.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2">
          <span className="font-bold text-sm tracking-tight">TOTAL</span>
          <span className="text-lg font-bold tracking-tight">
            Rp {sale.total.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-black/20">
          <span className="opacity-70">TUNAI (CASH)</span>
          <span>Rp {sale.cash_received.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center font-bold text-sm">
          <span>KEMBALIAN</span>
          <span>Rp {sale.change.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="text-center mt-10 pt-4 border-t border-dashed border-black/40">
        <p className="mb-1 font-bold uppercase text-[10px]">Terima Kasih</p>
        <p className="text-[9px] italic opacity-60">Barang yang sudah dibeli tidak dapat dikembalikan</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
