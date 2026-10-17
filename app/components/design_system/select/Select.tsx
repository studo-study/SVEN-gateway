"use client";
import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import classNames from "@studo/utils/classnames";

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

type SelectProps = {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  errorOption?: boolean;
  id?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  align?: "start" | "end" | "center";
  className?: string;
};

const sizeMap = {
  xs: {
    trigger: "px-1.5 py-0.5 text-xs gap-2",
    chevron: 9,
    item: "p-1.5 text-xs",
    label: "text-xs px-2",
  },
  sm: {
    trigger: "px-3 py-1.5 text-sm",
    chevron: 12,
    item: "p-1.5 text-xs",
    label: "text-xs px-2",
  },
  md: {
    trigger: "px-4 py-2 text-base",
    chevron: 14,
    item: "p-2 text-sm",
    label: "text-xs px-2",
  },
  lg: {
    trigger: "px-5 py-3 text-base",
    chevron: 14,
    item: "p-2 text-sm",
    label: "text-sm px-3",
  },
  xl: {
    trigger: "px-6 py-4 text-lg",
    chevron: 16,
    item: "p-3 text-base",
    label: "text-sm px-3",
  },
} as const;

const Select = ({
  options,
  value,
  onChange,
  placeholder = "Selecteer een optie",
  label,
  id,
  disabled,
  size = "lg",
  align = "start",
  className,
}: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const s = sizeMap[size];

  // trigger-positie meten zodat het portal-paneel op scherm-coords staat
  const updateCoords = React.useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  React.useLayoutEffect(() => {
    if (open) updateCoords();
  }, [open, updateCoords]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // fixed paneel bijhouden bij scroll/resize (bv. de tabel-pan)
    const reposition = () => updateCoords();
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updateCoords]);

  const handleSelect = (optionValue: string | number) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  const t = useTranslations("select");

  return (
    <div ref={containerRef} className={"relative min-w-fit"}>
      {label && (
        <label htmlFor={id} className={`text-muted-foreground ${s.label}`}>
          {label}
        </label>
      )}
      <button
        type={"button"}
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={classNames(
          `w-full rounded-full flex gap-2 flex-row cursor-pointer items-center justify-between outline-none ring-0 border border-border/30  bg-muted/30 text-left disabled:opacity-50 disabled:cursor-not-allowed ${s.trigger}`,
          className,
        )}
      >
        {selected && selected?.icon}
        <span
          className={
            selected
              ? ""
              : "text-muted-foreground flex flex-row gap-1 items-center"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={s.chevron}
          opacity={0.5}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {typeof document !== "undefined" &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords.top,
              ...(align === "end"
                ? {
                    left: coords.left + coords.width,
                    transform: "translateX(-100%)",
                  }
                : align === "center"
                  ? {
                      left: coords.left + coords.width / 2,
                      transform: "translateX(-50%)",
                    }
                  : { left: coords.left }),
              ...(align === "center" ? {} : { minWidth: coords.width }),
            }}
            className={`z-200 w-max max-w-[min(90vw,20rem)]
              ${align === "end" ? "origin-top-right" : align === "center" ? "origin-top" : "origin-top-left"}
              p-2 py-2 border border-border/30  text-foreground
              rounded-2xl  bg-muted
              gap-2 flex flex-col h-fit
              shadow-xl shadow-black/10
              transition-all duration-300 ease-out min-w-fit
              ${
                open
                  ? "opacity-100 scale-100 visible pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"w-full flex flex-col gap-1 min-w-fit"}>
              <span className={`w-full text-muted-foreground ${s.label}`}>
                {label ?? t("options")}
              </span>
              <div
                className={
                  "w-full h-fit flex flex-col max-h-60 scroll-hidden overflow-y-auto gap-1"
                }
              >
                {options.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={String(option.value)}
                      type={"button"}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full hover: hover:bg-muted/50 rounded-full px-3 flex flex-row items-center justify-between cursor-pointer ${
                        s.item
                      } ${isSelected ? " bg-muted/50" : ""}`}
                    >
                      <span
                        className={"truncate gap-2 flex flex-row items-center"}
                      >
                        {option.icon}
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className={"text-xs text-muted-foreground"}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

Select.displayName = "Select";

export default Select;
