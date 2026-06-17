import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "hooks/useAuth";
import { AuthProvider } from "./AuthContext";

function TestConsumer() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.name ?? "none"}</span>
      <button
        onClick={() => {
          void login("admin@example.com", "password");
        }}
      >
        Login valid
      </button>
      <button
        onClick={() => {
          void login("x@x.com", "wrong");
        }}
      >
        Login invalid
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  it("throws when useAuth is used outside AuthProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );
    consoleError.mockRestore();
  });

  it("starts unauthenticated with no user", () => {
    renderWithAuth();
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("sets the user on successful login", async () => {
    renderWithAuth();
    await userEvent.click(screen.getByText("Login valid"));
    await waitFor(
      () => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      },
      { timeout: 3000 },
    );
    expect(screen.getByTestId("user").textContent).toBe("Admin User");
  }, 4000);

  it("returns invalid_credentials for wrong password", async () => {
    let result:
      | Awaited<ReturnType<ReturnType<typeof useAuth>["login"]>>
      | undefined;

    function CaptureLogin() {
      const { login } = useAuth();
      return (
        <button
          onClick={() => {
            void login("x@x.com", "wrong").then((r) => {
              result = r;
            });
          }}
        >
          Go
        </button>
      );
    }

    render(
      <AuthProvider>
        <CaptureLogin />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText("Go"));
    await waitFor(
      () => {
        expect(result).toBeDefined();
      },
      { timeout: 3000 },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
  }, 4000);

  it("clears the user on logout", async () => {
    renderWithAuth();
    await userEvent.click(screen.getByText("Login valid"));
    await waitFor(
      () => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      },
      { timeout: 3000 },
    );
    await userEvent.click(screen.getByText("Logout"));
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("none");
  }, 4000);
});
