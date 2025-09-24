import * as React from "react";

import { cn } from "@/lib/utils";

function InfoCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("flex flex-col text-foreground", className)}
      {...props}
    />
  );
}

function InfoCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header py-4 grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function InfoCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

// function InfoCardDescription({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-description"
//       className={cn("text-muted-foreground text-sm", className)}
//       {...props}
//     />
//   );
// }

// function InfoCardAction({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-action"
//       className={cn(
//         "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
//         className
//       )}
//       {...props}
//     />
//   );
// }

function InfoCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "divide-y border border-border/30 shadow-sm overflow-hidden rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

// function InfoCardFooter({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-footer"
//       className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
//       {...props}
//     />
//   );
// }

export {
  InfoCard,
  InfoCardHeader,
  //   InfoCardFooter,
  InfoCardTitle,
  //   InfoCardAction,
  //   InfoCardDescription,
  InfoCardContent,
};
