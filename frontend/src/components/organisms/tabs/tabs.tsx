import React, { useState, useRef, KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultActiveId?: string;
  className?: string;
  onChange?: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveId,
  className = "",
  onChange,
}) => {
  const [activeId, setActiveId] = useState<string>(() => {
    if (defaultActiveId && tabs.some((tab) => tab.id === defaultActiveId)) {
      return defaultActiveId;
    }
    return tabs[0]?.id ?? "";
  });
  const [prevDefaultActiveId, setPrevDefaultActiveId] =
    useState(defaultActiveId);
  if (defaultActiveId !== prevDefaultActiveId) {
    setPrevDefaultActiveId(defaultActiveId);
    if (defaultActiveId && tabs.some((tab) => tab.id === defaultActiveId)) {
      setActiveId(defaultActiveId);
    }
  }
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabClick = (id: string) => {
    if (id !== activeId) {
      setActiveId(id);
      if (onChange) {
        onChange(id);
      }
    }
  };

  // Keyboard navigation for WCAG compliance
  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let newIndex: number;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    tabRefs.current[newIndex]?.focus();
    handleTabClick(tabs[newIndex].id);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab List */}
      <div
        role="tablist"
        className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                handleTabClick(tab.id);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e, index);
              }}
              className={`
                px-4 py-3 text-base font-medium transition-colors duration-200 ease-in-out cursor-pointer whitespace-nowrap
                border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-t-lg
                ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="relative w-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <div
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              tabIndex={0}
              className={`
                w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${isActive ? "animate-fade-in block" : "hidden"}
              `}
              hidden={!isActive}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
