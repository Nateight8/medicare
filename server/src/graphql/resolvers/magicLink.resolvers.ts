export const magicLinkResolvers = {
  Mutation: {
    /**
     * Request a magic link to be sent to the user's email
     */
    requestMagicLink: async (
      _: any,
      { email }: { email: string },
      context: any
    ) => {},

    /**
     * Verify a magic link token
     */
    verifyMagicLink: async (
      _: any,
      { token, email }: { token: string; email: string },
      context: any
    ) => {},

    /**
     * Verify an OTP code
     */
    verifyOtp: async (
      _: any,
      { email, otp }: { email: string; otp: string },
      context: any
    ) => {},
  },
};
