'use client';

/**
 * ConfirmModal - Reusable confirmation dialog
 * Replaces window.confirm() with a styled popup
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *
 *   // Trigger:
 *   setConfirm({ message: 'Delete this?', onConfirm: () => doDelete() });
 *
 *   // In JSX:
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmModal({ config, onClose }) {
  if (!config) return null;

  const { message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = config;

  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
          {danger ? (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Message */}
        <p className="text-center text-gray-800 font-semibold text-base mb-6 leading-snug">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors text-sm ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
