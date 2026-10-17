"use client";
import React, { ReactNode } from "react";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface SelectOption {
  value: string;
  label: string;
}

type ComboBoxProps = {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  onCreate?: (label: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dataCy?: string;
  title?: string;
  tabIndex?: number;
  searchable?: boolean;
  creatable?: boolean;
  createButton?: ReactNode;
};

const sizeMap = {
  xs: {
    trigger: "px-1.5 py-0.5 text-xs gap-2",
    chevron: 9,
    item: "p-1.5 text-xs",
    label: "text-xs px-2",
  },
  sm: {
    trigger: "px-3 py-1.5 text-sm gap-3",
    chevron: 12,
    item: "p-1.5 text-xs",
    label: "text-xs px-2",
  },
  md: {
    trigger: "px-4 py-2 text-base gap-4",
    chevron: 14,
    item: "p-2 text-sm",
    label: "text-xs px-2",
  },
  lg: {
    trigger: "h-10 px-5 text-sm gap-5",
    chevron: 14,
    item: "p-2 text-sm",
    label: "text-sm px-3",
  },
  xl: {
    trigger: "px-6 py-4 text-lg gap-5",
    chevron: 16,
    item: "p-3 text-base",
    label: "text-sm px-3",
  },
} as const;

const ComboBox = ({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Selecteer een optie",
  searchPlaceholder = "Zoeken...",
  label,
  id,
  disabled,
  size = "lg",
  dataCy,
  title,
  tabIndex,
  createButton,
  searchable = true,
  creatable = false,
}: ComboBoxProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const s = sizeMap[size];
  const selected = options.find((o) => String(o.value) === String(value));
  const t = useTranslations("combobox");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const showCreate = creatable && trimmedQuery.length > 0 && !exactMatch;

  // create-rij hangt onderaan, dus index = filtered.length
  const createIndex = filtered.length;
  const itemCount = filtered.length + (showCreate ? 1 : 0);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  React.useEffect(() => {
    if (open && searchable) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open, searchable]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (optionValue: string | number) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  const handleCreate = () => {
    onCreate?.(trimmedQuery);
    setOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showCreate && activeIndex === createIndex) {
        handleCreate();
      } else {
        const opt = filtered[activeIndex];
        if (opt) handleSelect(opt.value);
      }
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div title={title} ref={containerRef} className={"relative"}>
      {label && (
        <label htmlFor={id} className={`text-muted-foreground ${s.label}`}>
          {label}
        </label>
      )}
      <button
        type={"button"}
        id={id}
        disabled={disabled}
        data-cy={dataCy}
        tabIndex={tabIndex}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full flex flex-row items-center justify-between cursor-pointer rounded-4xl bg-elevated/30 border border-border/30 shadow-2xl text-foreground  text-left transition-all duration-300 outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed ${s.trigger}`}
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown
          size={s.chevron}
          opacity={0.5}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 top-full mt-2
          z-9999 p-3 border border-border/30
          rounded-2xl backdrop-blur-2xl min-w-30
          bg-muted/30 gap-2 flex flex-col h-fit
          shadow-xl shadow-black/10
          transition-all duration-300 ease-out origin-top
          ${
            open
              ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {searchable && (
          <div className={"flex flex-row gap-2 items-center min-w-0 flex-1"}>
            <div className="flex bg-muted/30 w-full rounded-3xl justify-between border border-border/30 text-sm">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="h-9 px-4 w-full outline-none bg-transparent"
              />
            </div>
            {createButton}
          </div>
        )}

        <div className={"w-full flex flex-col gap-1"}>
          <span className={`w-full text-muted-foreground ${s.label}`}>
            {label ?? t("options")}
          </span>
          <div
            ref={listRef}
            className={
              "w-full h-fit flex flex-col max-h-60 scroll-hidden overflow-y-auto"
            }
          >
            {filtered.length === 0 && !showCreate ? (
              <div
                className={`text-muted-foreground w-full flex items-center justify-center ${s.item}`}
              >
                {t("noResults")}
              </div>
            ) : (
              <>
                {filtered.map((option, idx) => {
                  const isSelected = String(option.value) === String(value);
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={String(option.value)}
                      data-idx={idx}
                      type={"button"}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full rounded-lg flex flex-row items-center justify-between cursor-pointer ${s.item} ${
                        isActive ? " bg-muted/50" : ""
                      } ${isSelected && !isActive ? " bg-muted/30" : ""}`}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <span className={"text-xs text-muted-foreground"}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}

                {showCreate && (
                  <button
                    data-idx={createIndex}
                    type={"button"}
                    onMouseEnter={() => setActiveIndex(createIndex)}
                    onClick={handleCreate}
                    className={`w-full rounded-lg flex flex-row items-center gap-2 cursor-pointer ${s.item} ${
                      activeIndex === createIndex ? " bg-muted/50" : ""
                    }`}
                  >
                    <FaPlus size={s.chevron - 2} opacity={0.6} />
                    <span>
                      {t("create")}{" "}
                      <span className="font-semibold">{trimmedQuery}</span>
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ComboBox.displayName = "ComboBox";

export default ComboBox;
