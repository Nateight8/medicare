import { gql } from "@apollo/client";

export const meOperation = {
  Queries: {
    me: gql`
      query Me {
        me {
          name
          email
        }
      }
    `,
  },
  Mutations: {
    updateProfile: gql`
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          success
        }
      }
    `,
    logout: gql`
      mutation Logout {
        logout {
          success
        }
      }
    `,
  },
};
