import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "@phosphor-icons/react";

export default function DisplayPhoto() {
  return (
    <>
      <Avatar className="size-20">
        <AvatarImage src="" />
        <AvatarFallback>
          <UserIcon />
        </AvatarFallback>
      </Avatar>
    </>
  );
}
