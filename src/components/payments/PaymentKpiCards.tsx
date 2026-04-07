interface PaymentItem {
  status: string;
}

interface Props {
  payments: PaymentItem[];
}

const PaymentKpiCards = ({ payments }: Props) => {
  const summary = [
    { label: "전체 세대", value: `${payments.length}세대` },
    { label: "납부완료", value: `${payments.filter((p) => p.status === "납부완료").length}세대`, color: "text-success" },
    { label: "미납", value: `${payments.filter((p) => p.status === "미납").length}세대`, color: "text-warning" },
    { label: "연체", value: `${payments.filter((p) => p.status.includes("연체")).length}세대`, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {summary.map(s => (
        <div key={s.label} className="kpi-card">
          <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
          <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
};

export default PaymentKpiCards;
