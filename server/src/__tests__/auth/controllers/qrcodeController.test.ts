import { Request, Response } from "express";
import QRCode from "qrcode";
import { qrController } from "../../../auth/controllers/qrcodeControler";

// Mock the QRCode module
jest.mock("qrcode");

describe("QR Code Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: { [key: string]: any };

  beforeEach(() => {
    mockRequest = {
      query: {
        requestId: "test-request-123",
      },
    };

    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
      }),
      send: jest.fn(),
      setHeader: jest.fn(),
    };

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("generateQRCode", () => {
    it("should generate a QR code for a valid requestId", async () => {
      // Mock the QRCode.toBuffer implementation
      const mockBuffer = Buffer.from("test-qr-code");
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(mockBuffer);

      // Set the BACKEND_URL environment variable
      process.env.BACKEND_URL = "https://api.example.com";

      await qrController.generateQRCode(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify the QR code was generated with the correct data
      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        "https://api.example.com/auth/qr-scan?requestId=test-request-123",
        {
          type: "png",
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        }
      );

      // Verify the response headers and status
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "image/png"
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it("should return 400 if requestId is missing", async () => {
      // Test with missing requestId
      mockRequest.query = {};

      await qrController.generateQRCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing or invalid requestId",
      });
    });

    it("should return 500 if QR code generation fails", async () => {
      // Mock the QRCode.toBuffer to throw an error
      (QRCode.toBuffer as jest.Mock).mockRejectedValue(
        new Error("QR generation failed")
      );

      await qrController.generateQRCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to generate QR code",
      });
    });
  });
});
