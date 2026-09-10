import React, { useEffect, useMemo, useState } from "react";

export default function PromptBox({
  componentMap,
  activeKey: controlledActiveKey,
  onActiveKeyChange,
  onTabsChange,
  ...componentProps
}) {
  const keys = useMemo(() => Object.keys(componentMap || {}), [componentMap]);
  const [internalActiveKey, setInternalActiveKey] = useState(keys[0] || "");

  const isControlled = controlledActiveKey !== undefined;
  const activeKey = isControlled ? controlledActiveKey : internalActiveKey;

  useEffect(() => {
    const tabs = Object.entries(componentMap || {}).map(([key, { label }]) => ({
      key,
      label,
    }));

    onTabsChange?.(tabs);
  }, [componentMap, onTabsChange]);

  useEffect(() => {
    if (keys.length === 0) {
      if (!isControlled) {
        setInternalActiveKey("");
      }
      return;
    }

    // 未選択、または現在のキーがcomponentMapに存在しない場合は先頭を選択。
    if (!activeKey || !componentMap?.[activeKey]) {
      const nextKey = keys[0];

      if (isControlled) {
        onActiveKeyChange?.(nextKey);
      } else {
        setInternalActiveKey(nextKey);
      }
    }
  }, [activeKey, componentMap, isControlled, keys, onActiveKeyChange]);

  if (!activeKey || !componentMap?.[activeKey]) {
    return null;
  }

  const ActiveComponent = componentMap[activeKey].component;

  return (
    <div className="flex w-full flex-col gap-4 rounded-br-md bg-gray-400 p-1">
      <ActiveComponent {...componentProps} promptKey={activeKey} />
    </div>
  );
}
