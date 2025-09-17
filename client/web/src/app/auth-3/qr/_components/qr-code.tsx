export default function QrCode() {
  return (
    <div className="relative max-w-3xs mb-4 aspect-square w-full p-4">
      <div className="absolute left-0 top-0 size-6 rounded-tl-md border-l border-t border-cyan-900" />
      <div className="absolute right-0 bottom-0 size-6 rounded-br-md border-r border-b border-cyan-900" />
      <div className="absolute left-0 bottom-0 size-6 rounded-bl-md border-l border-b border-cyan-900" />
      <div className="absolute right-0 top-0 size-6 rounded-tr-md border-r border-t border-cyan-900" />
      <div className="size-full border"></div>
    </div>
  );
}
