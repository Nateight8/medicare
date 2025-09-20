export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex items-center justify-center flex-col">
        <div className="flex-1 max-w-md flex items-center justify-center p-8">
          <div className="w-full md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
