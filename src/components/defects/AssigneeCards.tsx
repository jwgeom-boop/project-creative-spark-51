import { ASSIGNEES } from "./AssigneePopover";

interface AssigneeCardsProps {
  selected: string;
  onSelect: (name: string) => void;
  readOnly?: boolean;
}

const AssigneeCards = ({ selected, onSelect, readOnly }: AssigneeCardsProps) => {
  if (readOnly && selected) {
    const a = ASSIGNEES.find((x) => x.name === selected);
    if (!a) return null;
    return (
      <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
        <a.icon className="w-5 h-5 text-primary" />
        <div>
          <div className="text-sm font-semibold">{a.name}</div>
          <div className="text-xs text-muted-foreground">{a.specialty}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {ASSIGNEES.map((a) => (
        <button
          key={a.name}
          type="button"
          onClick={() => onSelect(a.name)}
          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-colors text-left ${
            selected === a.name
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
        >
          <a.icon className={`w-5 h-5 ${selected === a.name ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <div className="text-sm font-semibold">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.specialty}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AssigneeCards;
