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
};
