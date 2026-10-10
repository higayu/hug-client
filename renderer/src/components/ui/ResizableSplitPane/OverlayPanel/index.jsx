import { useState } from 'react';

/**
 * 背面のコンテンツに、開閉可能な前面コンテンツを重ねて配置する。
 * 前面側の位置・サイズ・開閉アニメーションは前面コンポーネントで管理する。
 *
 * @param {object} props
 * @param {React.ReactNode} props.children 背面コンテンツ
 * @param {(args: {isExpanded: boolean, onExpandedChange: Function}) => React.ReactNode} props.overlay 前面コンテンツを返す関数
 * @param {boolean} [props.defaultExpanded=true] 初期状態
 * @param {string} [props.contentClassName] 背面コンテンツの追加クラス
 * @param {string} [props.className] コンテナの追加クラス
 */
export default function OverlayPanel({
  children,
  overlay,
  defaultExpanded = true,
  contentClassName = '',
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`relative min-h-0 flex-1 overflow-hidden bg-white ${isExpanded ? 'z-30' : 'z-auto'} ${className}`}>
      <div
        className={`h-full overflow-auto ${contentClassName}`}
        inert={isExpanded ? '' : undefined}
        aria-hidden={isExpanded}
      >
        {children}
      </div>
      {overlay?.({
        isExpanded,
        onExpandedChange: setIsExpanded,
      })}
    </div>
  );
}
