// Type augmentation for react-router navigate function.
// Since we use <BrowserRouter> (declarative mode), navigate() returns void, not Promise<void>.
// This prevents false-positive @typescript-eslint/no-floating-promises errors.
// See: https://reactrouter.com/en/main/hooks/use-navigate#return-type-augmentation

import type { To, NavigateOptions } from "react-router";

declare module "react-router" {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
}
