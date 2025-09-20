import { AsclepiusIcon } from "@phosphor-icons/react/dist/ssr";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex items-center justify-center flex-col">
        <div className="hidden text-secondary rounded-xl flex items-center justify-center">
          <AsclepiusIcon size={48} />
        </div>
        <div className="flex-1 max-w-md flex items-center justify-center p-8">
          <div className="w-full">
            <div className="md:p-6">
              <div className=" mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Let&apos;s get u settled in
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Just a few details to personalize your experience
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
