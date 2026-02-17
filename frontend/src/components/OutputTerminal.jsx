import React from 'react';
import { Terminal, X } from 'lucide-react';

const OutputTerminal = ({ output, onClear }) => {
  return (
    <div className="h-full bg-[#1a1a1a] border-t border-white/10 flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-green-400" />
          <span className="text-sm text-white font-medium">Output</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded"
        >
          <X size={14} />
          Clear
        </button>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0d0d0d]">
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
          {output || 'Click "Run Code" to see output...'}
        </pre>
      </div>
    </div>
  );
};

export default OutputTerminal;