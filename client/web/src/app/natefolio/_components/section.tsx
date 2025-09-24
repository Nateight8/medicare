import { PropsWithChildren } from "react";

export default function Section({ children }: PropsWithChildren) {
  return (
    <>
      <div className="border-t flex  w-full">
        <div className=" flex-1"></div>
        <div className="border-x w-full max-w-3xl flex items-center justify-center">
          {children}
        </div>
        <div className=" flex-1"></div>
      </div>
    </>
  );
}
