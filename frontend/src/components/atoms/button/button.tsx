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
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 border border-transparent shadow-sm",
  secondary:
    "bg-gray-200 text-gray-900 hover:bg-gray-300 border border-transparent",
  outline:
    "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm",
  link: "bg-transparent text-blue-600 hover:underline border-transparent shadow-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  icon: "p-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
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

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${iconSpacing} ${className}`.trim();

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
