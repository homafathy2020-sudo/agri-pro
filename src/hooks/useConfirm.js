// src/hooks/useConfirm.js
import { useState, useCallback } from "react";

/**
 * Returns { confirm, ConfirmState } where:
 *  - confirm(id) opens a confirmation dialog
 *  - ConfirmState exposes { open, targetId, accept, reject }
 */
export const useConfirm = () => {
  const [state, setState] = useState({ open: false, targetId: null, resolve: null });

  const confirm = useCallback((id) =>
    new Promise((resolve) => {
      setState({ open: true, targetId: id, resolve });
    }),
  []);

  const accept = useCallback(() => {
    state.resolve && state.resolve(true);
    setState({ open: false, targetId: null, resolve: null });
  }, [state]);

  const reject = useCallback(() => {
    state.resolve && state.resolve(false);
    setState({ open: false, targetId: null, resolve: null });
  }, [state]);

  return {
    confirm,
    confirmState: { ...state, accept, reject },
  };
};
