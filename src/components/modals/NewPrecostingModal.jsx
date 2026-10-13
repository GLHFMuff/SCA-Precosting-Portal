import React, { useState } from 'react';
import { usePrecosting } from '../../context/PrecostingContext';
import { formatRupiah } from '../../utils/formatters';
import { X, Plus, Trash2, Scissors, Package, Layers, CheckCircle2 } from 'lucide-react';

export const NewPrecostingModal = () => {
  const { isNewModalOpen, setIsNewModalOpen, addNewPrecosting } = usePrecosting();

  const [precostingNo, setPrecostingNo] = useState(`PC-2026-00${Math.floor(Math.random() * 90) + 10}`);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Kemeja (Woven)');
  const [buyer, setBuyer] = useState('');
  const [season, setSeason] = useState('Spring / Summer 2026');
  const [targetQty, setTargetQty] = useState(2000);
  const [deliveryDate, setDeliveryDate] = useState('2026-06-30');

  // Fabric list
  const [fabrics, setFabrics] = useState([
    {
      id: 'f-new-1',
      name: 'Kain Katun Poplin 40s',
      spec: '100% Cotton, Lebar 58"',
      part: 'Badan & Lengan',
      consumption: 1.5,
      unit: 'Meter',
      unitPrice: 32000,
    },
  ]);

  // Accessories list
  const [accessories, setAccessories] = useState([
    {
      id: 'a-new-1',
      name: 'Kancing Poliester 18L (Standard)',
      spec: '4 Lubang, Tone on Tone',
      qtyPerPcs: 10,
      unit: 'Pcs',
      unitPrice: 200,
    },
    {
      id: 'a-new-2',
      name: 'Set Label (Main + Care + Hangtag) & OPP',
      spec: 'Standard retail pack',
      qtyPerPcs: 1,
      unit: 'Set',
      unitPrice: 3500,
    },
  ]);

  // Services list
  const [services, setServices] = useState([
    {
      id: 's-new-1',
      name: 'Jasa Cutting & Bundling',
      category: 'Direct Labor',
      description: 'Potong presisi pisau vertikal',
      unitPrice: 2000,
    },
    {
      id: 's-new-2',
      name: 'Jasa Sewing CMT Assembly',
      category: 'Direct Labor',
      description: 'Jahit perakitan standard',
      unitPrice: 15000,
    },
    {
      id: 's-new-3',
      name: 'Jasa Finishing, QC & Packaging',
      category: 'Factory Overhead',
      description: 'Setrika uap boiler dan packing',
      unitPrice: 3000,
    },
  ]);

  if (!isNewModalOpen) return null;

  // Real-time quick preview
  const fabricCostPerPcs = fabrics.reduce((sum, f) => sum + (Number(f.consumption) || 0) * (Number(f.unitPrice) || 0), 0);
  const accCostPerPcs = accessories.reduce((sum, a) => sum + (Number(a.qtyPerPcs) || 0) * (Number(a.unitPrice) || 0), 0);
  const jasaCostPerPcs = services.reduce((sum, s) => sum + (Number(s.unitPrice) || 0), 0);
  const cogmPerPcs = fabricCostPerPcs + accCostPerPcs + jasaCostPerPcs;
  const hppPerPcs = Math.round(cogmPerPcs * 1.025);
  const totalHppAllQty = hppPerPcs * (Number(targetQty) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Nama item garmen wajib diisi!');
      return;
    }

    const newItem = {
      precostingNo,
      itemName,
      itemCode: `ITEM-${Math.floor(Math.random() * 900) + 100}`,
      category,
      buyer: buyer || 'Umum',
      season,
      targetQty: Number(targetQty) || 1000,
      unit: 'Pcs',
      deliveryDate,
      fabrics,
      accessories,
      services,
    };

    addNewPrecosting(newItem);
    setIsNewModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
      <div className="modal-container new-precosting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Buat Precosting Pakaian Baru</h3>
            <p className="modal-subtitle">Petakan kebutuhan kain (fabric), aksesoris, jasa CMT dan target quantity</p>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={() => setIsNewModalOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-modal-form">
          <div className="modal-body scrollable-modal-body">
            {/* General Info */}
            <div className="form-section-title">Informasi Dasar Model Garmen</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Precosting *</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={precostingNo}
                  onChange={(e) => setPrecostingNo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Item Pakaian *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kemeja Pria Formal Regular"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kategori Pakaian</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Kemeja (Woven)">Kemeja (Woven)</option>
                  <option value="Blouse (Woven)">Blouse (Woven)</option>
                  <option value="T-Shirt & Polo">T-Shirt & Polo</option>
                  <option value="Outerwear & Hoodie">Outerwear & Hoodie</option>
                  <option value="Celana (Bottoms)">Celana (Bottoms)</option>
                  <option value="Jaket (Outdoor)">Jaket (Outdoor)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Buyer / Brand</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: ZARA / Executive / Uniqlo"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Quantity (Pcs) *</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  value={targetQty}
                  min="1"
                  onChange={(e) => setTargetQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Pengiriman</label>
                <input
                  type="date"
                  className="form-input"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Live Cost Summary Preview */}
            <div className="live-preview-box">
              <div className="live-box-title">Estimasi Perhitungan Cepat:</div>
              <div className="live-box-metrics">
                <div>Fabric/pcs: <strong>{formatRupiah(fabricCostPerPcs)}</strong></div>
                <div>Acc/pcs: <strong>{formatRupiah(accCostPerPcs)}</strong></div>
                <div>Jasa/pcs: <strong>{formatRupiah(jasaCostPerPcs)}</strong></div>
                <div>COGM/pcs: <strong className="text-purple">{formatRupiah(cogmPerPcs)}</strong></div>
                <div>HPP/pcs: <strong className="text-emerald">{formatRupiah(hppPerPcs)}</strong></div>
                <div className="live-total-line">Total Modal ({targetQty} pcs): <strong>{formatRupiah(totalHppAllQty)}</strong></div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={() => setIsNewModalOpen(false)}
            >
              Batal
            </button>
            <button type="submit" className="btn-modal-confirm-approve">
              <CheckCircle2 size={16} />
              <span>Simpan & Buat Precosting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
