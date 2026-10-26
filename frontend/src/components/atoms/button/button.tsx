import { forwardRef, ComponentProps } from "react";
import { SvgIcon } from "components/atoms/svg-sprite-loader";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  block?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-gradient text-white hover:opacity-90 border-transparent",
  secondary:
    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-transparent",
  outline:
    "bg-transparent text-emerald-500 border border-emerald-500 hover:bg-emerald-50",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
  link: "bg-transparent text-brand-gradient hover:underline border-transparent shadow-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  icon: "p-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "sm",
      icon,
      iconPosition = "left",
      isLoading = false,
      block = false,
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const heightAdjustMap: Record<ButtonSize, string> = {
      sm: "min-h-[30px]",
      md: "min-h-[42px]",
      lg: "min-h-[54px]",
      icon: "min-h-[42px]",
    };
    const heightAdjust = variant !== "link" ? heightAdjustMap[size] : "";

    // Default loader icon
    const LoadingIcon = () => (
      <SvgIcon
        name="loader"
        className="animate-spin"
        width="16"
        height="16"
        aria-hidden={true}
      />
    );

    let IconElement: React.FC | null = null;
    if (isLoading) {
      IconElement = LoadingIcon;
    } else if (icon) {
      IconElement = () => (
        <SvgIcon name={icon} width="18" height="18" aria-hidden={true} />
      );
    }

    const iconSpacing = children && size !== "icon" ? "gap-2" : "";
    const blockClass = block ? "w-full" : "";

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${heightAdjust} ${blockClass} ${iconSpacing} ${className}`
        .replace(/\s+/g, " ")
        .trim();

    return (
      <button
        ref={ref}
        type={rest.type ?? "button"}
        className={combinedClassName}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled ?? isLoading}
        {...rest}
      >
        {iconPosition === "left" && IconElement && <IconElement />}
        {children}
        {iconPosition === "right" && IconElement && <IconElement />}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
