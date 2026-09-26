import { useCallback, useEffect } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

import { useHugActions } from '@/hooks/useHugActions';
import { useDispatch } from 'react-redux';
import {
  clearLaravelAuthentication,
  setLaravelAuthentication,
} from '@/store/slices/authSlice';

export default function AutoLoginButton({ className = '' }) {
  const { handleLogin } = useHugActions();
  const dispatch = useDispatch();

  /**
   * 自動ログインボタン押下時の処理
   */
  const handleLogin_func = useCallback(async () => {
    try {
      const res = await window.electronAPI.jwtAutoLogin();

      if (!res?.success) {
        dispatch(clearLaravelAuthentication());

        console.error(
          'Laravel認証失敗:',
          res?.message,
          res?.error
        );

        return;
      }

      console.log('Laravel認証成功:', res.data?.user);

      dispatch(
        setLaravelAuthentication({
          user: res?.user ?? res?.data?.user ?? null,
          authenticated: res?.meta?.authenticated === true,
        })
      );

      await handleLogin();
    } catch (error) {
      dispatch(clearLaravelAuthentication());

      console.error(
        '自動ログイン処理中にエラーが発生しました:',
        error
      );
    }
  }, [dispatch, handleLogin]);

  useEffect(() => {
    document.addEventListener(
      'hug-startup-auto-login',
      handleLogin_func
    );

    return () => {
      document.removeEventListener(
        'hug-startup-auto-login',
        handleLogin_func
      );
    };
  }, [handleLogin_func]);

  return (
    <button
      id="loginBtn"
      type="button"
      onClick={handleLogin_func}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="自動ログイン"
    >
      <ArrowRightOnRectangleIcon
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      />

      <span>Login</span>
    </button>
  );
}