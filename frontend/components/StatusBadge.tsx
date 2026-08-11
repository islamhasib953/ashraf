import { CheckCircle, XCircle, Loader, Clock } from "lucide-react";

export default function StatusBadge({ status }: { status: string }) {
  const map: any = {
    success: <span className="badge badge-success"><CheckCircle size={10} />Success</span>,
    failed:  <span className="badge badge-error"><XCircle size={10} />Failed</span>,
    running: <span className="badge badge-running"><Loader size={10} className="animate-spin" />Running</span>,
    pending: <span className="badge badge-pending"><Clock size={10} />Pending</span>,
  };
  return map[status] || <span className="badge badge-pending">{status}</span>;
}
