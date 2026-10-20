import React, { useState } from 'react';
import { X, UserPlus, Users, Trash2, Check } from 'lucide-react';
import { DemoUserSummary } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: DemoUserSummary[];
  currentUserId: string;
  onSelectUser: (uid: string) => void;
  onNewUser: () => void;
  onNewUserWithName?: (name: string) => void;
  onDeleteUser: (uid: string) => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSelectUser,
  onNewUser,
  onNewUserWithName,
  onDeleteUser,
}) => {
  const [userToDelete, setUserToDelete] = useState<DemoUserSummary | null>(null);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Switch Demo User
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of demo users */}
          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {users.map((u) => {
              const isSelected = u.uid === currentUserId;
              return (
                <div
                  key={u.uid}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectUser(u.uid);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1 text-left min-w-0 py-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {u.displayName}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {u.ideaCount} {u.ideaCount === 1 ? 'idea' : 'ideas'}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Delete user button */}
                    <button
                      type="button"
                      onClick={() => setUserToDelete(u)}
                      title={`Delete ${u.displayName}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: New User Button or Inline Name Input */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {showNewInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim()) return;
                  if (onNewUserWithName) {
                    onNewUserWithName(newName.trim());
                  } else {
                    onNewUser();
                  }
                  setNewName('');
                  setShowNewInput(false);
                  onClose();
                }}
                className="space-y-2.5"
              >
                <input
                  type="text"
                  placeholder="Enter user name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewInput(false);
                      setNewName('');
                    }}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewInput(true)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ New user</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog for deleting user */}
      <ConfirmModal
        isOpen={userToDelete !== null}
        title="Delete this demo user and all their ideas?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (userToDelete) {
            onDeleteUser(userToDelete.uid);
            setUserToDelete(null);
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />
    </>
  );
};
