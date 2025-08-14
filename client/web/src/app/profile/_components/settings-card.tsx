import { cn } from "@/lib/utils";
import { PencilSimpleLineIcon } from "@phosphor-icons/react";

export default function SettingsCard({
  title,
  description,
  icon,
  variant,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive";
}) {
  return (
    <>
      <div className="flex items-center space-x-3 p-4">
        <div
          className={cn(
            "w-10 h-10 bg-muted rounded-full flex items-center justify-center",
            variant === "destructive" &&
              "bg-cyan-700/20 border-cyan-900 text-cyan-500"
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="font-medium text-sm mt-1">{description}</p>
        </div>
        <button className="p-2 hover:bg-muted hover:cursor-pointer rounded-full transition-colors">
          <PencilSimpleLineIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </>
  );
}
