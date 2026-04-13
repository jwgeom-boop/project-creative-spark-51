import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wrench, Paintbrush, Zap, DoorOpen } from "lucide-react";
import { useState } from "react";

export const ASSIGNEES = [
  { name: "OO배관", specialty: "배관·누수", icon: Wrench },
  { name: "OO인테리어", specialty: "마감재·도배", icon: Paintbrush },
  { name: "OO전기", specialty: "전기·설비", icon: Zap },
  { name: "OO창호", specialty: "창호·유리", icon: DoorOpen },
];

interface AssigneePopoverProps {
  onSelect: (name: string) => void;
  children: React.ReactNode;
}

const AssigneePopover = ({ onSelect, children }: AssigneePopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {ASSIGNEES.map((a) => (
          <button
            key={a.name}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(a.name);
              setOpen(false);
            }}
          >
            <a.icon className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.specialty}</div>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default AssigneePopover;
