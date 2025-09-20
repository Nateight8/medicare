import { Calendar, ChevronRight, FileHeart, Phone } from "lucide-react";
import { ReactNode } from "react";

export default function InfoCard({ children }: { children: ReactNode }) {
  return (
    <>
      {" "}
      <div className=" ">
        <div className="py-4 ">
          <h3 className="font-medium">Personal Information</h3>
        </div>
        <div className="divide-y border border-border/30 shadow-sm overflow-hidden rounded-md bg-muted/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">March 15, 1985</p>
              </div>
            </div>
          </div>
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
            <div className="flex items-center space-x-3">
              <FileHeart className="w-5 h-5" />
              <span className="text-sm font-medium">Medical Profile</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
