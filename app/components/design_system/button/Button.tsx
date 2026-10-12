import {MatrixLoader} from "~/components/design_system/loader/Loader";

export type ButtonVariant = keyof typeof variantMap;
export type ButtonSize = keyof typeof sizeMap;

interface ButtonProps extends Omit<React.HTMLProps<HTMLButtonElement>, "size" | "type"> {
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    icon?: React.ReactNode;
    isLoading?: boolean;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const variantMap = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-200/50",
    ghost: "bg-transparent text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
} as const;

const sizeMap = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
    icon: "w-10 h-10 p-0 aspect-square",
} as const;

const Button = ({
    icon,
    iconLeft,
    iconRight,
    variant = "primary",
    size = "md",
    isLoading,
    disabled,
    type = "button",
    className,
    children,
    ...rest
}: ButtonProps) => {
    const classes = [
        "rounded-full font-medium flex flex-row gap-2 items-center justify-center",
        "cursor-pointer transition-colors duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantMap[variant],
        sizeMap[size],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button type={type} disabled={disabled || isLoading} className={classes} {...rest}>
            {isLoading ? (
                <MatrixLoader variant={"scan"} rounded={true}/>
            ) : (
                <>
                    {iconLeft}
                    {icon}
                    {children}
                    {iconRight}
                </>
            )}
        </button>
    );
};

Button.displayName = "Button";
export default Button;
