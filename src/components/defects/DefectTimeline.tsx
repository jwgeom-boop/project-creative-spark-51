interface TimelineStep {
  label: string;
  date?: string;
  detail?: string;
  done: boolean;
  current: boolean;
}

interface DefectTimelineProps {
  status: string;
  reportDate?: string;
  company?: string;
  visitDate?: string;
}

const DefectTimeline = ({ status, reportDate, company, visitDate }: DefectTimelineProps) => {
  const steps: TimelineStep[] = [
    {
      label: "접수완료",
      date: reportDate || "",
      done: true,
      current: status === "미배정",
    },
    {
      label: "담당자 배정",
      detail: company && company !== "미배정" ? company : undefined,
      done: status === "처리중" || status === "완료",
      current: status === "처리중" && !visitDate,
    },
    {
      label: "처리중",
      detail: visitDate ? `방문 예정: ${visitDate}` : undefined,
      done: status === "완료",
      current: status === "처리중",
    },
    {
      label: "처리완료",
      done: status === "완료",
      current: false,
    },
  ];

  return (
    <div className="pt-2">
      <div className="text-xs font-semibold text-muted-foreground mb-3">처리 이력</div>
      <div className="relative pl-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 pb-4 last:pb-0 relative">
            {/* Line */}
            {idx < steps.length - 1 && (
              <div className={`absolute left-[7px] top-4 w-0.5 h-full ${step.done ? "bg-green-400" : "bg-border"}`} />
            )}
            {/* Dot */}
            <div className="relative z-10 mt-0.5">
              {step.done ? (
                <div className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-green-200" />
              ) : step.current ? (
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-blue-200 animate-pulse" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-muted border-2 border-border" />
              )}
            </div>
            {/* Content */}
            <div className="min-w-0">
              <div className={`text-sm font-medium ${step.done ? "text-foreground" : step.current ? "text-blue-600" : "text-muted-foreground"}`}>
                {step.label}
              </div>
              {(step.date || step.detail) && (
                <div className="text-xs text-muted-foreground">{step.date || step.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefectTimeline;
