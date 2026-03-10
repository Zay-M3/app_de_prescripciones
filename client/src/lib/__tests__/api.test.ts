import { useAuthStore } from "@/store/authStore";
import { apiRequest } from "../api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("apiRequest", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useAuthStore.setState({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      user: { id: "1", email: "dr@test.com", name: "Dr Test", role: "doctor" },
    });
  });

  it("agrega Authorization header con el token del store", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "1", name: "Prescripcion Test" }),
    });

    await apiRequest("/prescriptions", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-access-token");
  });
});
