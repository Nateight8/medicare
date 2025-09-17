import { AsclepiusIcon } from "@phosphor-icons/react/dist/ssr";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex items-center justify-center flex-col">
        <div className=" text-secondary rounded-xl flex items-center justify-center">
          <AsclepiusIcon size={48} />
        </div>
        {children}
      </div>
    </div>
  );
}
