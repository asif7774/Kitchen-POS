import { forwardRef, ComponentProps, memo } from "react";
import { SvgIcon } from "components/atoms/svg-sprite-loader";

export interface CardProps extends Omit<
  ComponentProps<"div">,
  "className" | "children"
> {
  title: string;
  description: string;
  icon: string;
  href: string;
  borderColor?: string;
}

const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(
    (
      {
        title,
        description,
        icon,
        href,
        borderColor = "border-t-blue-500",
        ...rest
      },
      ref,
    ) => {
      return (
        <div
          ref={ref}
          className={`bg-white rounded-lg shadow-lg p-6 relative overflow-hidden h-full transition-all duration-300 hover:shadow-xl ${borderColor} border-t-4`}
          {...rest}
        >
          <div className="absolute right-4 top-4">
            <SvgIcon
              name={icon}
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              aria-hidden={true}
            />
          </div>
          <div className="flex flex-col h-full pr-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-base text-gray-600 flex-1 leading-relaxed mb-4">
              {description}
            </p>
            <div className="mt-auto">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
              >
                Visit documentation<span className="sr-only"> for {title}</span>{" "}
                →
              </a>
            </div>
          </div>
        </div>
      );
    },
  ),
);

Card.displayName = "Card";

export default Card;
