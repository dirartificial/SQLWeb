import React, { useState } from 'react';
import { X, Copy, Check, Code2 } from 'lucide-react';

interface ViewDdlModalProps {
  tableName: string;
  ddl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewDdlModal: React.FC<ViewDdlModalProps> = ({
  tableName,
  ddl,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ddl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Definición DDL</h3>
              <p className="text-xs text-slate-500 font-mono">Tabla: {tableName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto custom-scrollbar leading-relaxed">
            <code>{ddl}</code>
          </pre>

          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="font-semibold text-slate-700 block mb-1">Nota didáctica:</span>
          Esta es la sentencia <code className="font-mono text-blue-600 font-semibold">CREATE TABLE</code> registrada en la metadata maestra de SQLite (<code className="font-mono text-slate-700">sqlite_master</code>).
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
