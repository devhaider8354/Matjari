import mongoose from 'mongoose';

// سجل نشاط الإدارة: من فعل ماذا ومتى ومن أين. يُحذف تلقائياً بعد 180 يوماً
const AuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  actorName: String,
  actorEmail: String,
  action: { type: String, index: true }, // مفتاح مثل product.update
  label: String, // وصف عربي يُعرض
  target: String, // معرّف أو اسم العنصر
  details: String,
  ip: String,
  ok: { type: Boolean, default: true },
  at: { type: Date, default: Date.now },
});
AuditLogSchema.index({ at: -1 });
AuditLogSchema.index({ at: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
