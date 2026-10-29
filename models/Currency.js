import mongoose from 'mongoose';

// عملات العرض الإضافية. الأسعار تُخزَّن دائماً بالعملة الأساسية،
// وrate = كم يساوي 1 من العملة الأساسية بهذه العملة.
const CurrencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nameAr: { type: String, required: true },
    nameEn: { type: String, default: '' },
    symbol: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    decimals: { type: Number, default: 2, min: 0, max: 3 },
    symbolFirst: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Currency || mongoose.model('Currency', CurrencySchema);
