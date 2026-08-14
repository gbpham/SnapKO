jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  manipulateAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  File: class MockFile {
    base64() {
      return "";
    }
  },
}));

jest.mock("../services/api", () => ({
  api: {
    post: jest.fn(),
  },
}));

import {
  confirmAiResultCharge,
  getAiImageProfile,
  parseHandwritingMultiWithAI,
  parseInvoiceMultiWithAI,
} from "../services/aiService";
import { api } from "../services/api";

describe("aiService expected network failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not call console.error for expected network failures", async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(
      new Error("Network request failed"),
    );
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await parseInvoiceMultiWithAI(["base64-image"], "business-1");

    expect(result.success).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("posts the scan charge token to confirm-ai-result", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      charged: true,
      quota: { used: 1, quota: 100, remaining: 99 },
    });

    await confirmAiResultCharge("scan-token");

    expect(api.post).toHaveBeenCalledWith("/scans/confirm-ai-result", {
      token: "scan-token",
    });
  });

  it("preserves unknown and explicit-zero stock values with V2 review metadata", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      items: [
        {
          ingredient_name: "Bia lon",
          quantity: null,
          import_qty: null,
          unit: "lon",
          confidence: 0.42,
          needs_review: true,
        },
        {
          ingredient_name: "Nước ngọt",
          quantity: 0,
          import_qty: 0,
          unit: "chai",
          confidence: 0.99,
          needs_review: false,
        },
      ],
      confidence: 0.7,
      items_needing_review: 1,
      warnings: [],
      reviewRequired: true,
      pipelineVersion: "v2",
      providerPath: "modal->gemini-repair",
      validationIssues: [
        { code: "UNKNOWN_QUANTITY", rowIndex: 0, field: "quantity" },
      ],
      latencyMs: 1234,
    });

    const result = await parseHandwritingMultiWithAI(
      ["base64-image"],
      "business-1",
      "SIMPLE",
      "STORAGE",
    );

    expect(result.items[0]).toMatchObject({ stock_qty: null, import_qty: null });
    expect(result.items[1]).toMatchObject({ stock_qty: 0, import_qty: 0 });
    expect(result).toMatchObject({
      reviewRequired: true,
      pipelineVersion: "v2",
      providerPath: "modal->gemini-repair",
      latencyMs: 1234,
    });
    expect(result.validationIssues).toEqual([
      { code: "UNKNOWN_QUANTITY", rowIndex: 0, field: "quantity" },
    ]);
  });

  it("uses document-specific image profiles", () => {
    expect(getAiImageProfile("STOCK_CHECK")).toMatchObject({
      maxDimension: 1800,
      quality: 0.8,
    });
    expect(getAiImageProfile("IMPORT")).toMatchObject({
      maxDimension: 1600,
      quality: 0.78,
    });
    expect(getAiImageProfile("SALES")).toMatchObject({
      maxDimension: 1600,
      quality: 0.78,
    });
  });
});
